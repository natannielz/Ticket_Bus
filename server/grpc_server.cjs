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
  const { user_id, armada_id, date, seats, total_price } = call.request;
  const seatStr = JSON.stringify(seats);

  // Simple validation
  if (!user_id || !armada_id || !seats.length) {
    return callback(null, { success: false, error_message: "Invalid data" });
  }

  db.run("INSERT INTO bookings (user_id, armada_id, date, seats, total_price) VALUES (?, ?, ?, ?, ?)",
    [user_id, armada_id, date, seatStr, total_price],
    function (err) {
      if (err) {
        return callback(null, { success: false, error_message: err.message });
      }
      // Emit update for Admin Dashboard (via SeatSync or just Polling)
      eventBus.emit('seat_update', { armada_id, booked_seats: seats });
      callback(null, { success: true, booking_id: this.lastID.toString() });
    }
  );
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

  if (role === 'admin') {
    adminStreams.push(call);
    // Send history logic could go here
  } else {
    userStreams.set(user_id, call);
    // Notify admins new user is online
    adminStreams.forEach(adminCall => {
      adminCall.write({
        type: 'user_online',
        data: { sender_id: user_id, content: 'User Online', timestamp: new Date().toISOString() }
      });
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
  call.on('data', (msg) => {
    // msg: { sender_id, receiver_id, content, ... }
    console.log(`Chat Msg: ${msg.sender_id} -> ${msg.receiver_id}: ${msg.content}`);

    const timestamp = new Date().toISOString();
    const fullMsg = { ...msg, timestamp };

    // Logic: specific receiver or admin broadcast
    if (msg.receiver_id === 'admin') {
      // Send to ALL admins
      adminStreams.forEach(adminCall => {
        try {
          // Start of stream call used as a "push" channel? 
          // Actually, bidirectional means we usually use one method.
          // But here we split: JoinChat puts them in "Listening Mode".
          // SendMessage is "Sending Mode".
          // We write to the *JoinChat* stream of the receiver.
          adminCall.write(fullMsg);
        } catch (e) { console.error("Error sending to admin", e); }
      });
    } else {
      // Send to specific User
      const userStream = userStreams.get(msg.receiver_id);
      if (userStream) {
        userStream.write(fullMsg);
      }
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
    server.start();
  });
};

module.exports = { startServer };
