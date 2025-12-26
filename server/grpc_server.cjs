const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const db = require('./database.cjs'); // Reuse existing DB connection
const { EventEmitter } = require('events');

const PROTO_PATH = path.join(__dirname, 'proto', 'bus.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const busProto = grpc.loadPackageDefinition(packageDefinition).bus_system;

// Global Event Emitter for Chat and Seat Sync
const eventBus = new EventEmitter();

// In-memory store for active chat streams
const userStreams = new Map(); // userId -> call
const adminStreams = []; // List of admin calls

// --- Service Implementations ---

// 1. Booking Service
const createBooking = (call, callback) => {
  const { user_id, armada_id, schedule_id, date, seats, total_price } = call.request;
  const seatStr = JSON.stringify(seats);

  if (!user_id || !schedule_id || !seats.length) {
    return callback(null, { success: false, error_message: "Missing Required Fields" });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Double check capacity inside transaction
    db.get("SELECT total_seats, seats_booked FROM schedules WHERE id = ?", [schedule_id], (err, schedule) => {
      if (err || !schedule) {
        db.run("ROLLBACK");
        return callback(null, { success: false, error_message: "Schedule Not Found" });
      }

      if (schedule.total_seats - (schedule.seats_booked || 0) < seats.length) {
        db.run("ROLLBACK");
        return callback(null, { success: false, error_message: "Insufficient Capacity" });
      }

      // 2. Insert Booking
      db.run("INSERT INTO bookings (user_id, armada_id, schedule_id, date, seats, total_price) VALUES (?, ?, ?, ?, ?, ?)",
        [user_id, armada_id, schedule_id, date, seatStr, total_price],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            return callback(null, { success: false, error_message: err.message });
          }

          const bookingId = this.lastID;

          // 3. Increment counters
          db.run("UPDATE schedules SET seats_booked = seats_booked + ?, booked_seats = booked_seats + ? WHERE id = ?",
            [seats.length, seats.length, schedule_id], (err) => {
              if (err) {
                db.run("ROLLBACK");
                return callback(null, { success: false, error_message: "Failed to update inventory" });
              }

              db.run("COMMIT");
              eventBus.emit('seat_update', { armada_id, schedule_id, booked_seats: seats });
              callback(null, { success: true, booking_id: bookingId.toString() });
            });
        }
      );
    });
  });
};

const getBookingStatus = (call, callback) => {
  const id = call.request.booking_id;
  db.get("SELECT status, check_in_status FROM bookings WHERE id = ?", [id], (err, row) => {
    if (err || !row) return callback(null, { status: 'unknown' });
    callback(null, {
      status: row.status,
      checked_in: row.check_in_status === 'checked_in'
    });
  });
};

// 2. Chat Service
const joinChat = (call) => {
  const { user_id, role } = call.request;
  console.log(`User ${user_id} (${role}) connected to chat stream.`);

  // Helper to send wrapped events
  call.sendEvent = (type, payloadObj) => {
    // payloadObj should be { message: ... } or { typing: ... }
    // We spread it to match ChatEvent oneof structure: { type, message: ... }
    call.write({ type, ...payloadObj });
  };

  if (role === 'admin') {
    adminStreams.push(call);
    // Send history logic could go here
  } else {
    userStreams.set(user_id, call);
    // Notify admins new user is online
    adminStreams.forEach(adminCall => {
      if (adminCall.sendEvent) {
        adminCall.sendEvent('user_online', {
          message: { sender_id: user_id, content: 'User Online', timestamp: new Date().toISOString() }
        });
      }
    });
  }

  // Handle disconnect
  call.on('cancelled', () => {
    if (role === 'admin') {
      const index = adminStreams.indexOf(call);
      if (index > -1) adminStreams.splice(index, 1);
    } else {
      userStreams.delete(user_id);
    }
  });
};

const sendMessage = (call) => {
  call.on('data', (wrapper) => {
    // wrapper is ChatClientMessage { payload: 'message' | 'typing' | 'read' }

    // 1. Handle Text Message
    if (wrapper.payload === 'message' && wrapper.message) {
      const msg = wrapper.message;
      console.log(`[gRPC Chat] ${msg.sender_id} -> ${msg.receiver_id}: ${msg.content}`);

      const timestamp = new Date().toISOString();
      const fullMsg = { ...msg, timestamp };

      // Persist to DB
      db.run(
        `INSERT INTO chat_messages (sender_id, sender_name, receiver_id, content, is_admin, created_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
        [msg.sender_id, msg.sender_name || 'User', msg.receiver_id, msg.content, msg.is_admin ? 1 : 0, timestamp],
        function (err) {
          if (err) console.error('[gRPC Chat] DB Insert Error:', err);
        }
      );

      // Emit for dashboard
      eventBus.emit('chat_event', { type: 'new_message', message: fullMsg });

      // Route to recipient
      const targetStreams = msg.receiver_id === 'admin' ? adminStreams : [userStreams.get(msg.receiver_id)].filter(Boolean);
      targetStreams.forEach(s => {
        if (s && s.sendEvent) s.sendEvent('new_message', { message: fullMsg });
      });
    }

    // 2. Handle Typing
    else if (wrapper.payload === 'typing' && wrapper.typing) {
      const { user_id, is_typing } = wrapper.typing;
      const target = wrapper.typing.role === 'admin' ? userStreams.get(wrapper.typing.target_id) : null;

      // If coming from user -> send to admins
      if (!wrapper.typing.role || wrapper.typing.role !== 'admin') {
        adminStreams.forEach(s => s.sendEvent && s.sendEvent('typing', { typing: wrapper.typing }));
      }
      // If coming from admin -> send to specific user (need target_id in struct? or infer?)
      // The proto definition for TypingIndicator is: string user_id, string user_name, bool is_typing.
      // It lacks a "target_id". Let's assume broadcast to context or update proto? 
      // For now, let's just broadcast to admins if from user.
      // If from admin, we might need to know WHO they are typing to.
      // Let's stick to "User typing" for now as per plan focus.
    }

    // 3. Handle Read Receipt
    else if (wrapper.payload === 'read' && wrapper.read) {
      // Broadcast read receipt
      const targetStreams = adminStreams; // Simple default for user->admin read
      targetStreams.forEach(s => s.sendEvent && s.sendEvent('read', { read: wrapper.read }));
    }
  });

  call.on('end', () => {
    call.end();
  });
};

const streamChatUpdates = (call) => {
  // Dedicated stream for Admin "Inbox List" updates
  // Implementation simplified: reusing JoinChat for admin usually works best
  // But specific implementation:
  const listener = (event) => {
    call.write(event);
  };
  eventBus.on('chat_event', listener);
  call.on('cancelled', () => eventBus.off('chat_event', listener));
};

// 3. Seat Sync
const watchSeatAvailability = (call) => {
  const { route_id } = call.request; // Could filter by route

  // Initial State sending could go here

  // Listen for updates
  const listener = (data) => {
    // data: { armada_id, booked_seats }
    // Simple logic: just forward updates
    call.write({ armada_id: data.armada_id, booked_seats: data.booked_seats });
  };

  eventBus.on('seat_update', listener);
  call.on('cancelled', () => eventBus.off('seat_update', listener));
};

// --- Server Setup ---
const startServer = () => {
  const server = new grpc.Server();
  server.addService(busProto.BookingService.service, { CreateBooking: createBooking, GetBookingStatus: getBookingStatus });
  server.addService(busProto.ChatService.service, { JoinChat: joinChat, SendMessage: sendMessage, StreamChatUpdates: streamChatUpdates });
  server.addService(busProto.SeatSyncService.service, { WatchSeatAvailability: watchSeatAvailability });

  const PORT = '0.0.0.0:50051';
  server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error("gRPC Server bind failed:", err);
      return;
    }
    console.log(`gRPC Server running on port ${port}`);
  });
};

module.exports = { startServer };
