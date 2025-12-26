const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database.cjs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.json());
const httpServer = createServer(app);

// Prevent crash on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  // Keep running? For dev, yes.
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// Initialize gRPC Server
const { startServer, eventBus } = require('./grpc_server.cjs');
startServer();

// Initialize gRPC Client
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = path.join(__dirname, 'proto', 'bus.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const busProto = grpc.loadPackageDefinition(packageDefinition).bus_system;
const bookingClient = new busProto.BookingService('localhost:50051', grpc.credentials.createInsecure());
const chatClient = new busProto.ChatService('localhost:50051', grpc.credentials.createInsecure());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = 3005; // Hardcoded for dev reliability in this environment
const SECRET_KEY = "supersecretkey_dev_only"; // Hardcoded for dev reliability in this environment

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Forbidden: Invalid Token" });

    // FETCH FRESH ROLE FROM DB
    // console.log("Verifying fresh role for user:", user.id);
    db.get("SELECT role FROM users WHERE id = ?", [user.id], (dbErr, row) => {
      // console.log("DB Role Fetch Result:", dbErr, row);
      if (dbErr) {
        console.error("Auth DB Error:", dbErr);
        return res.status(500).json({ error: "Auth DB Error" });
      }
      if (!row) {
        console.error("User not found in DB during auth:", user.id);
        return res.status(403).json({ error: "Forbidden: User not found" });
      }

      // Update user object with fresh role
      req.user = { ...user, role: row.role };
      next();
    });
  });
};



// Global gRPC -> Socket.io Bridge
// This handles messages coming from gRPC clients and pushes them to Socket.io clients
eventBus.on('chat_event', (event) => {
  if (event.type === 'new_message' && event.message) {
    const msg = event.message;
    const fullMsg = {
      ...msg,
      isAdmin: !!msg.is_admin
    };

    console.log(`[Global Bridge] Forwarding gRPC msg to Socket.io: ${msg.sender_id} -> ${msg.receiver_id}`);

    // Route to recipient
    if (msg.receiver_id === 'admin') {
      io.to('admin_room').emit('receive_message', fullMsg);
    } else {
      io.to(String(msg.receiver_id)).emit('receive_message', fullMsg);
    }

    // Always notify admin room for dashboard updates
    if (msg.receiver_id !== 'admin') {
      io.to('admin_room').emit('receive_message', fullMsg);
    }

    // Echo to sender's socket if they are connected via Socket.io
    io.to(String(msg.sender_id)).emit('receive_message', fullMsg);
  } else if (event.type === 'typing') {
    // Broadcast typing indicators if needed
    const { user_id, receiver_id } = event.typing;
    if (receiver_id === 'admin') {
      io.to('admin_room').emit('typing', event.typing);
    } else {
      io.to(String(receiver_id)).emit('typing', event.typing);
    }
  }
});

// Socket.io Real-Time Chat
io.on('connection', (socket) => {
  console.log('User connected to Socket.io:', socket.id);

  socket.on('join', ({ userId, role }) => {
    try {
      const uId = String(userId);
      socket.join(uId);
      if (role === 'admin') {
        socket.join('admin_room');
      }
      console.log(`[Socket.IO] ${uId} (${role}) joined rooms: ${uId}${role === 'admin' ? ', admin_room' : ''}`);

      // REMOVED: Redundant per-socket gRPC Bridge.
      // The global eventBus listener now handles gRPC -> Socket.io communication.
    } catch (e) {
      console.error("Socket Join Error:", e);
    }
  });

  socket.on('send_message', (msg) => {
    // msg: { sender_id, sender_name, receiver_id, content, is_admin }
    const { sender_id, sender_name, receiver_id, content, is_admin } = msg;
    const safeIsAdmin = is_admin === true || is_admin === 'true' || is_admin === 1;

    // Persist to DB
    const timestamp = new Date().toISOString();
    db.run(
      `INSERT INTO chat_messages (sender_id, sender_name, receiver_id, content, is_admin, created_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
      [String(sender_id), sender_name || 'User', String(receiver_id), content, safeIsAdmin ? 1 : 0, timestamp],
      function (err) {
        if (err) {
          console.error('[Socket.IO] DB Insert Error:', err);
        } else {
          // Emit to eventBus so gRPC listeners (like StreamChatUpdates) know about it
          const messageId = this.lastID;
          const fullMsg = {
            id: messageId,
            sender_id: String(sender_id),
            sender_name: sender_name || 'User',
            receiver_id: String(receiver_id),
            content,
            is_admin: safeIsAdmin,
            timestamp,
            created_at: timestamp
          };

          eventBus.emit('chat_event', { type: 'new_message', message: fullMsg });

          // Broadcast to Socket.IO clients
          try {
            if (receiver_id === 'admin') {
              io.to('admin_room').emit('receive_message', { ...fullMsg, isAdmin: safeIsAdmin });
            } else {
              io.to(String(receiver_id)).emit('receive_message', { ...fullMsg, isAdmin: safeIsAdmin });
            }

            if (receiver_id !== 'admin') {
              io.to('admin_room').emit('receive_message', { ...fullMsg, isAdmin: safeIsAdmin });
            }

            // Echo to sender
            io.to(String(sender_id)).emit('receive_message', { ...fullMsg, isAdmin: safeIsAdmin });
          } catch (e) {
            console.error("Socket Emit Error:", e);
          }
        }
      }
    );
  });

  // Handle Typing Indicator
  socket.on('typing', (data) => {
    // data: { user_id, user_name, is_typing, receiver_id, role }
    const { user_id, user_name, is_typing, receiver_id, role } = data;

    // 1. Send to gRPC (for Admin Dashboard)
    const chatStream = chatClient.SendMessage();
    chatStream.write({
      typing: {
        user_id: String(user_id),
        user_name: user_name,
        is_typing: !!is_typing
      }
    });
    chatStream.end();

    // 2. Emit to Socket.IO Recipient
    if (receiver_id === 'admin') {
      io.to('admin_room').emit('typing', data);
    } else {
      io.to(String(receiver_id)).emit('typing', data);
    }
  });

  // Handle Read Receipt
  socket.on('read', (data) => {
    // data: { message_id, reader_id, receiver_id }
    const { message_id, reader_id, receiver_id } = data;
    const timestamp = new Date().toISOString();

    // 1. Send to gRPC
    const chatStream = chatClient.SendMessage();
    chatStream.write({
      read: {
        message_id: String(message_id),
        reader_id: String(reader_id),
        timestamp
      }
    });
    chatStream.end();

    // 2. Emit to Socket.IO Recipient
    if (receiver_id === 'admin') {
      io.to('admin_room').emit('read', { ...data, timestamp });
    } else {
      io.to(String(receiver_id)).emit('read', { ...data, timestamp });
    }
  });

  socket.on('broadcast_delay', (data) => {
    // data: { schedule_id, route_name, delay_mins, reason }
    console.log(`BROADCAST: Delay on ${data.route_name} - ${data.delay_mins}m`);
    io.emit('delay_alert', data); // Broadcast to all connected clients (users & admins)
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from Socket.io');
    if (socket.grpcStream) {
      socket.grpcStream.cancel(); // or .end()
      socket.grpcStream = null;
    }
  });
});

// API Routes
app.get('/api/chat/history/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  const is_admin = req.user.role === 'admin';

  // If admin, they see all messages for that user. If user, they see their own.
  const query = "SELECT * FROM chat_messages WHERE (sender_id = ? OR receiver_id = ?) ORDER BY created_at ASC";
  db.all(query, [userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// Admin: Get Active Conversations
app.get('/api/admin/chat/conversations', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });

  const query = `
    SELECT sender_id, sender_name, MAX(created_at) as last_msg_time, content as last_msg
    FROM chat_messages 
    WHERE is_admin = 0
    GROUP BY sender_id
    ORDER BY last_msg_time DESC
  `;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// Get Armadas
app.get('/api/armadas', (req, res) => {
  db.all("SELECT * FROM armadas", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Login Attempt: email=${email}`);
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) {
      console.log('Login failed: User not found or DB error');
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const valid = bcrypt.compareSync(password, user.password);
    console.log(`User found: ${user.email}, Role: ${user.role}, Password Valid: ${valid}`);

    if (valid) {
      const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });
});

// Register
// Update User Profile
app.put('/api/users/me', authenticateToken, (req, res) => {
  const { name, email } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });

  db.run("UPDATE users SET name = ? WHERE id = ?", [name, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.get("SELECT id, name, email, role FROM users WHERE id = ?", [req.user.id], (err, row) => {
      res.json({ message: "Profile updated", user: row });
    });
  });
});

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);
  db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Auto login
    const token = jwt.sign({ id: this.lastID, name, role: 'user' }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user: { id: this.lastID, name: name, role: 'user' } });
  });
});

// Bookings (Protected - Users Only)
app.post('/api/bookings', authenticateToken, (req, res) => {
  // Role-based access control: Admins cannot book
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: "Admins cannot create bookings. Please use a user account." });
  }

  const { schedule_id, date, seats, passenger_name } = req.body; // seats can be a number or array

  if (!schedule_id) return res.status(400).json({ error: "schedule_id required" });

  const seatCount = Array.isArray(seats) ? seats.length : parseInt(seats);
  const seatList = Array.isArray(seats) ? seats : Array.from({ length: seatCount }, (_, i) => `Auto-${i + 1}`);

  // 1. First validate capacity via Express/DB (Quick check)
  db.get(`
    SELECT s.*, a.capacity, (SELECT SUM(seats) FROM bookings WHERE schedule_id = s.id AND date = ? AND status != 'cancelled') as booked_count
    FROM schedules s
    JOIN armadas a ON s.armada_id = a.id
    WHERE s.id = ?
  `, [date, schedule_id], (err, schedule) => {
    if (err || !schedule) return res.status(404).json({ error: "Schedule not found" });

    const availableSeats = schedule.capacity - (schedule.booked_count || 0);
    if (seatCount > availableSeats) {
      return res.status(400).json({ error: "Not enough capacity", available: availableSeats });
    }

    const bookingCode = crypto.randomUUID();
    const totalPrice = (schedule.price || 0) * seatCount;

    // 2. Offload creation to gRPC Service
    const request = {
      user_id: req.user.id.toString(),
      armada_id: schedule.armada_id.toString(),
      schedule_id: schedule_id.toString(),
      date: date,
      seats: seatList,
      total_price: totalPrice
    };

    bookingClient.CreateBooking(request, (err, response) => {
      if (err || !response.success) {
        return res.status(500).json({ error: response?.error_message || "gRPC Service Error" });
      }

      // 3. Update local DB with additional metadata
      db.run("UPDATE bookings SET passenger_name = ?, schedule_id = ?, booking_code = ? WHERE id = ?",
        [passenger_name, schedule_id, bookingCode, response.booking_id], (err) => {
          if (err) console.error("Metadata Update Error:", err);

          res.json({
            message: "Booking success (via gRPC Service)",
            id: response.booking_id,
            bookingCode: bookingCode,
            totalPrice
          });
        });
    });
  });
});

app.get('/api/bookings/:id', authenticateToken, (req, res) => {
  const query = `
        SELECT bookings.*, 
               armadas.name as armada_name, armadas.level as armada_level, armadas.image_path as armada_image,
               r.name as route_name, r.origin, r.destination,
               s.departure_time, s.arrival_time
        FROM bookings 
        LEFT JOIN armadas ON bookings.armada_id = armadas.id
        LEFT JOIN schedules s ON bookings.schedule_id = s.id
        LEFT JOIN routes r ON s.route_id = r.id
        WHERE bookings.id = ? AND (bookings.user_id = ? OR ? = 'admin')
    `;
  db.get(query, [req.params.id, req.user.id, req.user.role], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Booking not found" });
    res.json({ data: row });
  });
});

// User: Cancel Booking
app.delete('/api/bookings/:id', authenticateToken, (req, res) => {
  const bookingId = req.params.id;

  db.get("SELECT schedule_id, seats, status FROM bookings WHERE id = ? AND user_id = ?", [bookingId, req.user.id], (err, booking) => {
    if (err || !booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.status === 'cancelled') return res.status(400).json({ error: "Already cancelled" });

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      db.run("UPDATE bookings SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE id = ?", [bookingId], (err) => {
        if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }

        db.run("UPDATE schedules SET seats_booked = MAX(0, seats_booked - ?), booked_seats = MAX(0, booked_seats - ?) WHERE id = ?",
          [booking.seats, booking.seats, booking.schedule_id], (err) => {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }

            db.run("COMMIT");
            res.json({ message: "Booking cancelled successfully" });
          });
      });
    });
  });
});

app.get('/api/bookings', authenticateToken, (req, res) => {
  const query = `
        SELECT bookings.*, armadas.name as armada_name, armadas.image_path as armada_image, r.name as route_name
        FROM bookings 
        LEFT JOIN armadas ON bookings.armada_id = armadas.id
        LEFT JOIN schedules s ON bookings.schedule_id = s.id
        LEFT JOIN routes r ON s.route_id = r.id
        WHERE bookings.user_id = ?
    `;
  db.all(query, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// Admin Dashboard
app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });

  const stats = {};

  db.serialize(() => {
    // 1. Basic Stats (Armadas)
    db.get("SELECT COUNT(*) as count FROM armadas", (err, row) => {
      stats.totalArmadas = row.count || 0;

      // 2. Bookings
      db.get("SELECT COUNT(*) as count FROM bookings", (err, row) => {
        stats.totalBookings = row.count || 0;

        // 3. Users
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
          stats.totalUsers = row.count || 0;

          // 4. Revenue
          db.get("SELECT SUM(total_price) as total FROM bookings", (err, row) => {
            stats.totalRevenue = row.total || 0;

            // 5. Active Buses
            db.get("SELECT COUNT(*) as active FROM armadas WHERE status IN ('available', 'on_duty')", (err, row) => {
              stats.activeBuses = row.active || 0;

              // 6. On Duty Crews
              db.get("SELECT COUNT(*) as onDuty FROM crews WHERE status IN ('Active', 'On-trip')", (err, row) => {
                stats.onDutyCrews = row.onDuty || 0;

                // 7. Today Schedules
                db.get("SELECT COUNT(*) as todayCount FROM schedules WHERE is_live = 1", (err, row) => {
                  stats.todaySchedules = row.todayCount || 0;

                  // 8. Revenue Trend (Last 7 Days)
                  db.all(`SELECT date, SUM(total_price) as revenue FROM bookings 
                          GROUP BY date 
                          ORDER BY date DESC LIMIT 7`, (err, rows) => {
                    const revData = (rows || []).reverse().map(r => ({ name: r.date, revenue: r.revenue }));

                    // 9. Occupancy Data
                    db.get("SELECT SUM(capacity) as total_seats FROM armadas", (err, row) => {
                      const totalSeats = row.total_seats || 100; // avoid div by 0
                      db.get("SELECT SUM(seats) as booked_seats FROM bookings WHERE status != 'cancelled'", (err, row) => {
                        const bookedSeats = row.booked_seats || 0;
                        const occupancyData = [
                          { name: 'Occupied', value: bookedSeats },
                          { name: 'Available', value: Math.max(0, totalSeats - bookedSeats) }
                        ];

                        // 10. Upcoming Departures
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const todayName = dayNames[new Date().getDay()];

                        const upcomingQuery = `
                            SELECT s.*, a.name as bus, a.license_plate as plate, r.name as route
                            FROM schedules s
                            JOIN routes r ON s.route_id = r.id
                            JOIN armadas a ON s.armada_id = a.id
                            WHERE s.days LIKE ? AND s.is_live = 1
                            LIMIT 5
                        `;

                        db.all(upcomingQuery, [`%${todayName}%`], (err, upRows) => {
                          const upcomingDepartures = (upRows || []).map(r => ({
                            id: r.id,
                            bus: r.bus,
                            plate: r.plate || 'N/A',
                            time: r.departure_time,
                            driver_status: 'Ready', // Mocked
                            route: r.route
                          }));

                          // 11. Recent Transactions
                          const transQuery = `
                              SELECT bookings.*, users.name as user_name, armadas.name as armada_name 
                              FROM bookings 
                              LEFT JOIN users ON bookings.user_id = users.id
                              LEFT JOIN armadas ON bookings.armada_id = armadas.id
                              ORDER BY bookings.id DESC LIMIT 10
                          `;

                          db.all(transQuery, (err, transRows) => {
                            const formattedRows = (transRows || []).map(r => ({
                              ...r,
                              user: { name: r.user_name },
                              armada: { name: r.armada_name }
                            }));

                            res.json({
                              totalArmadas: stats.totalArmadas,
                              totalBookings: stats.totalBookings,
                              totalUsers: stats.totalUsers,
                              activeBuses: stats.activeBuses,
                              onDutyCrews: stats.onDutyCrews,
                              todaySchedules: stats.todaySchedules,
                              totalRevenue: stats.totalRevenue,
                              bookings: formattedRows,
                              revenueData: revData,
                              occupancyData: occupancyData,
                              upcomingDepartures: upcomingDepartures
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// Admin: Update User Role
app.put('/api/admin/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const { role } = req.body;
  const userId = req.params.id;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Must be 'user' or 'admin'" });
  }

  db.run("UPDATE users SET role = ? WHERE id = ?", [role, userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: `User role updated to ${role}` });
  });
});

// Admin: Delete User
app.delete('/api/admin/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const userId = req.params.id;

  // Prevent admin from deleting themselves
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  db.run("DELETE FROM users WHERE id = ?", [userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  });
});

// Admin: Get All Crews
app.get('/api/admin/crews', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const query = `
        SELECT crews.*, armadas.name as bus_name 
        FROM crews 
        LEFT JOIN armadas ON crews.assigned_bus_id = armadas.id
        ORDER BY crews.id DESC
    `;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// Admin: Create Crew
app.post('/api/admin/crews', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const { name, role, phone, assigned_bus_id } = req.body;
  db.run("INSERT INTO crews (name, role, phone, assigned_bus_id) VALUES (?, ?, ?, ?)",
    [name, role, phone, assigned_bus_id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Crew created", id: this.lastID });
    });
});

// Admin: Update Crew
app.put('/api/admin/crews/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const { name, role, phone, assigned_bus_id, status } = req.body;
  db.run("UPDATE crews SET name = ?, role = ?, phone = ?, assigned_bus_id = ?, status = ? WHERE id = ?",
    [name, role, phone, assigned_bus_id, status || 'Active', req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Crew updated" });
    });
});

// Admin: Delete Crew (with Dependency Check)
app.delete('/api/admin/crews/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const crewId = req.params.id;

  // Check if linked to active schedules
  db.get("SELECT id FROM schedules WHERE (driver_id = ? OR conductor_id = ?) AND is_live = 1", [crewId, crewId], (err, schedule) => {
    if (err) return res.status(500).json({ error: err.message });
    if (schedule) {
      return res.status(409).json({
        error: "Dependency Error",
        message: "Resource is linked to an active schedule. Unpublish or reassign the schedule first."
      });
    }

    db.run("DELETE FROM crews WHERE id = ?", [crewId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Crew deleted" });
    });
  });
});

// Admin: Booking Check-in
app.post('/api/admin/bookings/checkin/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  db.run("UPDATE bookings SET check_in_status = 'checked_in' WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Passenger checked in" });
  });
});

// Admin: Booking No-show
app.post('/api/admin/bookings/noshow/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  db.run("UPDATE bookings SET check_in_status = 'no_show' WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Passenger marked as no-show" });
  });
});

// Admin: Get All Bookings
app.get('/api/admin/bookings', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  // Prefer passenger_name (manual) over users.name (registered)
  const query = `
        SELECT bookings.*, 
               COALESCE(bookings.passenger_name, users.name) as user_name, 
               armadas.name as armada_name 
        FROM bookings 
        LEFT JOIN users ON bookings.user_id = users.id
        LEFT JOIN armadas ON bookings.armada_id = armadas.id
        ORDER BY bookings.id DESC
    `;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// Admin: Manual Booking Creation
app.post('/api/admin/bookings/manual', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const { user_name, date, schedule_id, seats, total_price } = req.body;

  db.get("SELECT armada_id FROM schedules WHERE id = ?", [schedule_id], (err, schedule) => {
    if (err || !schedule) return res.status(404).json({ error: "Schedule not found" });

    const seatStr = Array.isArray(seats) ? seats.join(',') : seats;

    db.run("INSERT INTO bookings (passenger_name, date, armada_id, schedule_id, seat_numbers, seats, total_price, status, check_in_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 'pending')",
      [user_name, date, schedule.armada_id, schedule_id, seatStr, seats.length, total_price],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Manual Booking Created", id: this.lastID });
      }
    );
  });
});

// Admin: Get All Armadas (Already exists as /api/armadas public, but maybe we want a dedicated one or just reuse)
// Admin: Create Armada
app.post('/api/admin/armadas', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const { name, level, price_per_km, route, amenities, seat_config, history, image_path, capacity, status } = req.body;
  db.run(`INSERT INTO armadas (name, level, price_per_km, route, amenities, seat_config, history, image_path, capacity, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, level, price_per_km, route, amenities, seat_config, history, image_path, capacity, status],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Armada created", id: this.lastID });
    });
});

// Admin: Update Armada
app.put('/api/admin/armadas/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const { name, level, price_per_km, amenities, seat_config, history, image_path, capacity, status, license_plate } = req.body;
  db.run(`UPDATE armadas SET name = ?, level = ?, price_per_km = ?, amenities = ?, seat_config = ?, history = ?, image_path = ?, capacity = ?, status = ?, license_plate = ? 
          WHERE id = ?`,
    [name, level, price_per_km, amenities, seat_config, history, image_path, capacity, status, license_plate, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Armada updated" });
    });
});

// Admin: Get All Users
app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  db.all("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// Admin: Get Master Data for Operations Center
app.get('/api/admin/operations/master-data', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });

  const data = {};
  db.serialize(() => {
    db.all("SELECT * FROM armadas", (err, rows) => { if (!err) data.armadas = rows || []; });
    db.all("SELECT * FROM crews", (err, rows) => { if (!err) data.crews = rows || []; });
    db.all("SELECT * FROM schedules WHERE is_live = 1", (err, rows) => { if (!err) data.schedules = rows || []; });
    db.all("SELECT * FROM stops", (err, rows) => { if (!err) data.stops = rows || []; });
    db.all("SELECT * FROM routes", (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      data.routes = rows || [];
      res.json({ data });
    });
  });
});

// Admin: Delete Armada (with Dependency Check)
app.delete('/api/admin/armadas/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const armadaId = req.params.id;

  // Check if linked to active schedules
  db.get("SELECT id FROM schedules WHERE armada_id = ? AND is_live = 1", [armadaId], (err, schedule) => {
    if (err) return res.status(500).json({ error: err.message });
    if (schedule) {
      return res.status(409).json({
        error: "Dependency Error",
        message: "Resource is linked to an active schedule. Unpublish or reassign the schedule first."
      });
    }

    db.run("DELETE FROM armadas WHERE id = ?", [armadaId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Armada deleted" });
    });
  });
});

// Admin: Get All Users
app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  db.all("SELECT id, name, email, role, status, created_at FROM users", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// Operations Command Center: Master Data
app.get('/api/admin/operations/master-data', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });

  const data = {};

  db.serialize(() => {
    // 1. Armadas
    db.all("SELECT * FROM armadas", (err, rows) => {
      data.armadas = rows || [];

      // 2. Crews
      db.all(`SELECT crews.*, armadas.name as bus_name 
              FROM crews 
              LEFT JOIN armadas ON crews.assigned_bus_id = armadas.id`, (err, rows) => {
        data.crews = rows || [];

        // 3. Routes
        db.all("SELECT * FROM routes", (err, routeRows) => {
          data.routes = routeRows || [];

          // 3b. Stops
          db.all("SELECT * FROM stops ORDER BY route_id, stop_order", (err, stopRows) => {
            data.stops = stopRows || [];

            // 4. Schedules
            const scheduleQuery = `
              SELECT schedules.*, 
                     routes.name as route_name, 
                     armadas.name as armada_name,
                     d.name as driver_name,
                     c.name as conductor_name
              FROM schedules
              LEFT JOIN routes ON schedules.route_id = routes.id
              LEFT JOIN armadas ON schedules.armada_id = armadas.id
              LEFT JOIN crews d ON schedules.driver_id = d.id
              LEFT JOIN crews c ON schedules.conductor_id = c.id
            `;
            db.all(scheduleQuery, (err, schedRows) => {
              data.schedules = schedRows || [];
              res.json({ data: data });
            });
          });
        });
      });
    });
  });
});

// Admin: Update Armada Status (with Integrity Check)
app.put('/api/admin/armadas/:id/status', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const { status } = req.body;
  const armadaId = req.params.id;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Update Armada Status
    db.run("UPDATE armadas SET status = ? WHERE id = ?", [status, armadaId], function (err) {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }

      // Integrity Check: If maintenance, flag schedules and deactivate
      if (status === 'maintenance') {
        db.run("UPDATE schedules SET needs_reassignment = 1, is_live = 0 WHERE armada_id = ?", [armadaId], (err) => {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: err.message });
          }
          db.run("COMMIT");
          res.json({ message: "Armada in maintenance. Schedules deactivated and flagged." });
        });
      } else {
        db.run("COMMIT");
        res.json({ message: "Armada status updated" });
      }
    });
  });
});

// Admin: Toggle Schedule Live Status
app.put('/api/admin/schedules/:id/toggle-live', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const scheduleId = req.params.id;

  db.get("SELECT is_live FROM schedules WHERE id = ?", [scheduleId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Schedule not found" });
    const newStatus = row.is_live === 1 ? 0 : 1;
    db.run("UPDATE schedules SET is_live = ? WHERE id = ?", [newStatus, scheduleId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Schedule status toggled", is_live: newStatus });
    });
  });
});

// ... (User, Armada, Booking APIs)

// Routes APIs
app.get('/api/admin/routes', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  db.all("SELECT * FROM routes ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

app.post('/api/admin/routes', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const { name, description, duration, color, origin, destination, coordinates, distanceKm, stops } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.run("INSERT INTO routes (name, description, duration, color, origin, destination, coordinates, distanceKm) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name, description, duration, color, origin, destination, JSON.stringify(coordinates), distanceKm],
      function (err) {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }
        const routeId = this.lastID;

        // Insert Stops
        if (stops && stops.length > 0) {
          const stmt = db.prepare("INSERT INTO stops (route_id, name, type, latitude, longitude, stop_order, time_spent, fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
          stops.forEach((stop, index) => {
            stmt.run(routeId, stop.name, stop.type, stop.latitude, stop.longitude, index, stop.time_spent, stop.fee);
          });
          stmt.finalize();
        }

        db.run("COMMIT");
        res.json({ message: "Route created", id: routeId });
      }
    );
  });
});

// Admin: Get Specific Route with Stops
app.get('/api/admin/routes/:id', authenticateToken, (req, res) => {
  // Left as exercise / if needed for edit
});

// Schedules APIs
app.get('/api/admin/schedules', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const query = `
        SELECT schedules.*, 
               routes.name as route_name, 
               armadas.name as armada_name,
               d.name as driver_name,
               c.name as conductor_name
        FROM schedules
        LEFT JOIN routes ON schedules.route_id = routes.id
        LEFT JOIN armadas ON schedules.armada_id = armadas.id
        LEFT JOIN crews d ON schedules.driver_id = d.id
        LEFT JOIN crews c ON schedules.conductor_id = c.id
        ORDER BY schedules.id DESC
     `;
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// Admin: Create Schedule (with Conflict Detection & Automated Pricing)
app.post('/api/admin/schedules', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const { route_id, armada_id, days, departure_time, arrival_time, price, price_weekend, driver_id, conductor_id } = req.body;

  // Conflict Detection Helper
  const checkConflict = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM schedules 
        WHERE (armada_id = ? OR driver_id = ? OR conductor_id = ?)
        AND is_live = 1
      `;
      db.all(query, [armada_id, driver_id, conductor_id], (err, rows) => {
        if (err) return reject(err);

        const newDaysList = days.split(',').map(d => d.trim());
        const conflict = rows.find(row => {
          const existingDays = row.days.split(',').map(d => d.trim());
          return newDaysList.some(day => existingDays.includes(day));
        });

        resolve(conflict);
      });
    });
  };

  db.serialize(async () => {
    try {
      const conflict = await checkConflict();
      if (conflict) {
        return res.status(409).json({
          error: "Resource Allocation Conflict",
          message: `Resource already assigned to schedule on overlapping days.`,
          conflict: conflict
        });
      }

      // Automated Pricing Engine
      let finalPrice = price;
      let finalPriceWeekend = price_weekend;

      if (!finalPrice) {
        const route = await new Promise(r => db.get("SELECT distanceKm FROM routes WHERE id = ?", [route_id], (err, row) => r(row)));
        const armada = await new Promise(r => db.get("SELECT price_per_km FROM armadas WHERE id = ?", [armada_id], (err, row) => r(row)));

        if (route && armada && route.distanceKm) {
          finalPrice = Math.round(route.distanceKm * armada.price_per_km);
          finalPriceWeekend = Math.round(finalPrice * 1.2);
        }
      }

      db.run("INSERT INTO schedules (route_id, armada_id, days, departure_time, arrival_time, price, price_weekend, driver_id, conductor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [route_id, armada_id, days, departure_time, arrival_time, finalPrice, finalPriceWeekend || (finalPrice * 1.2), driver_id, conductor_id],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: "Schedule created successfully", id: this.lastID, price: finalPrice });
        }
      );
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// Admin: Delete Schedule
app.delete('/api/admin/schedules/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const scheduleId = req.params.id;
  db.run("DELETE FROM schedules WHERE id = ?", [scheduleId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Schedule not found" });
    res.json({ message: "Schedule deleted successfully" });
  });
});

// Admin: Update Schedule (with optional conflict check)
app.put('/api/admin/schedules/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });
  const { days, departure_time, arrival_time, price, price_weekend, driver_id, conductor_id, armada_id } = req.body;
  const scheduleId = req.params.id;

  // Conflict detection is skipped for PUT in this simple version, but in production
  // you'd want to check if the NEW assignments conflict with OTHER schedules.

  db.run(`UPDATE schedules SET days = ?, departure_time = ?, arrival_time = ?, price = ?, price_weekend = ?, driver_id = ?, conductor_id = ?, armada_id = ? 
          WHERE id = ?`,
    [days, departure_time, arrival_time, price, price_weekend, driver_id, conductor_id, armada_id, scheduleId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Schedule updated successfully" });
    });
});

// Public: Get Schedules with Dynamic Pricing
app.get('/api/schedules', (req, res) => {
  const { from, to, date } = req.query; // e.g. ?from=Jakarta&to=Bandung&date=2025-12-25

  // Basic query for routes matching origin/dest
  // Then filter schedules by Day of Week of the 'date'

  // Note: For simplicity in this demo, we just fetch all and filter in memory or basics
  // In production: Join routes, filter by origin/destination.

  const query = `
        SELECT s.*, r.origin, r.destination, r.name as route_name, r.duration, a.name as armada_name, a.level as armada_level, a.seat_config, a.image_path as armada_image, a.capacity
        FROM schedules s
        JOIN routes r ON s.route_id = r.id
        JOIN armadas a ON s.armada_id = a.id
        WHERE 1=1 AND s.is_live = 1 AND a.status != 'maintenance'
        ${from ? "AND r.origin LIKE ?" : ""}
        ${to ? "AND r.destination LIKE ?" : ""}
    `;

  const params = [];
  if (from) params.push(`%${from}%`);
  if (to) params.push(`%${to}%`);

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Filter by Date (Day of Week)
    const targetDate = date ? new Date(date) : new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayName = dayNames[targetDate.getDay()];

    let filtered = rows.filter(row => {
      // days is JSON string e.g. "['Monday', 'Friday']" or just text "Daily"
      if (!row.days) return false;
      if (row.days.includes('Daily')) return true;
      return row.days.includes(targetDayName);
    });

    // Apply Dynamic Pricing (Weekend Surge)
    filtered = filtered.map(item => {
      const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6 || targetDate.getDay() === 5; // Fri, Sat, Sun
      return {
        ...item,
        price: isWeekend && item.price_weekend ? item.price_weekend : (isWeekend ? Math.round(item.price * 1.2) : item.price),
        is_surge: isWeekend
      };
    });

    res.json({ data: filtered });
  });
});

// Public: Get Detailed Schedule (Mission Detail)
app.get('/api/schedules/:id', (req, res) => {
  const scheduleId = req.params.id;
  const query = `
        SELECT s.*, 
               r.name as route_name, r.description as route_description, r.origin, r.destination, r.duration, r.coordinates, r.distanceKm,
               a.name as armada_name, a.level as armada_level, a.amenities, a.seat_config, a.history, a.image_path as armada_image, a.capacity
        FROM schedules s
        JOIN routes r ON s.route_id = r.id
        JOIN armadas a ON s.armada_id = a.id
        WHERE s.id = ?
    `;

  db.get(query, [scheduleId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Schedule not found" });

    // Fetch stops for this route
    db.all("SELECT * FROM stops WHERE route_id = ? ORDER BY stop_order ASC", [row.route_id], (err, stops) => {
      if (err) return res.status(500).json({ error: err.message });

      // Parse coordinates if they are stored as JSON string
      let coordinates = [];
      try {
        coordinates = row.coordinates ? JSON.parse(row.coordinates) : [];
      } catch (e) {
        // Fallback or simple array check
        coordinates = [];
      }

      res.json({
        data: {
          ...row,
          stops: stops || [],
          coordinates: coordinates
        }
      });
    });
  });
});

// Public: Get Booked Seats for a Schedule on a Date
app.get('/api/schedules/:id/seats', (req, res) => {
  const scheduleId = req.params.id;
  const date = req.query.date || new Date().toISOString().split('T')[0];

  // Fetch all bookings for this schedule and date, and extract seat_numbers
  db.all(
    "SELECT seat_numbers FROM bookings WHERE schedule_id = ? AND date = ? AND status != 'cancelled'",
    [scheduleId, date],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      // Flatten all seat numbers into a single array
      const bookedSeats = [];
      rows.forEach(row => {
        if (row.seat_numbers) {
          const seats = row.seat_numbers.split(',').map(s => s.trim());
          seats.forEach(s => { if (s) bookedSeats.push(s); });
        }
      });

      res.json({ data: bookedSeats });
    }
  );
});


const axios = require('axios'); // Ensure axios is required

// ... previous code ...

app.post('/api/admin/calculate-route', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden: Admin Access Required" });

  // Expects: origin: {lat, lng}, destination: {lat, lng}, waypoints: [{lat, lng}]
  const { origin, destination, waypoints } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({ error: "Origin and Destination required" });
  }

  // Format for TomTom: lat,lng:lat,lng...
  let routeString = `${origin.lat},${origin.lng}`;

  if (waypoints && waypoints.length > 0) {
    waypoints.forEach(wp => {
      routeString += `:${wp.lat},${wp.lng}`;
    });
  }

  routeString += `:${destination.lat},${destination.lng}`;

  const TOMTOM_KEY = "p9GYmqIrndxj3DzOZKMkI6TWYt0RGBmD"; // Using the key provided
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${routeString}/json?key=${TOMTOM_KEY}`;

  axios.get(url)
    .then(response => {
      const points = response.data.routes[0].legs.flatMap(leg => leg.points.map(p => ({ lat: p.latitude, lng: p.longitude })));
      const summary = response.data.routes[0].summary;
      res.json({ geometry: points, summary: summary });
    })
    .catch(error => {
      const errorMsg = error.response ? error.response.data?.error?.message || error.response.data : error.message;
      console.error("TomTom API Error:", errorMsg);
      res.status(502).json({
        error: "Routing Provider Error",
        message: "Failed to calculate tactical path. Please verify coordinates.",
        detail: errorMsg
      });
    });
});

// Server Startup
httpServer.listen(PORT, () => {
  console.log(`Command Center OS [Socket.io Active] listening on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} is busy, retrying in 1s...`);
    setTimeout(() => {
      httpServer.close();
      httpServer.listen(PORT);
    }, 1000);
  } else {
    console.error('Server Start Error:', err);
  }
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  httpServer.close(() => {
    console.log('Server closed.');
    db.close((err) => {
      console.log('Database connection closed.');
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  httpServer.close(() => {
    db.close(() => {
      process.exit(0);
    });
  });
});

