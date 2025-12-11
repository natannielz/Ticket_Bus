const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database.cjs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = "supersecretkey_dev_only"; // Hardcoded for dev reliability in this environment

// Initialize gRPC Server
const grpcServer = require('./grpc_server.cjs');
grpcServer.startServer();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public'))); // Serve public assets like images

// API Routes

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
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });
});

// Register
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

// Bookings (Protected)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/bookings', authenticateToken, (req, res) => {
  const { armada_id, date, seats, total_price } = req.body;
  db.run("INSERT INTO bookings (user_id, armada_id, date, seats, total_price) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, armada_id, date, seats, total_price], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Booking success", id: this.lastID });
    });
});

app.get('/api/bookings', authenticateToken, (req, res) => {
  const query = `
        SELECT bookings.*, armadas.name as armada_name, armadas.image_path as armada_image
        FROM bookings 
        LEFT JOIN armadas ON bookings.armada_id = armadas.id
        WHERE bookings.user_id = ?
    `;
  db.all(query, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// Admin Dashboard
app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);

  const stats = {};

  // 1. Basic Stats
  db.get("SELECT COUNT(*) as count FROM armadas", (err, row) => {
    stats.totalArmadas = row.count || 0;
    db.get("SELECT COUNT(*) as count FROM bookings", (err, row) => {
      stats.totalBookings = row.count || 0;
      db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        stats.totalUsers = row.count || 0;
        db.get("SELECT SUM(total_price) as total FROM bookings", (err, row) => {
          stats.totalRevenue = row.total || 0;

          // 2. Revenue Trend (Last 7 Days)
          db.all(`SELECT date, SUM(total_price) as revenue FROM bookings 
                  GROUP BY date 
                  ORDER BY date DESC LIMIT 7`, (err, rows) => {
            const revData = (rows || []).reverse().map(r => ({ name: r.date, revenue: r.revenue }));

            // 3. Occupancy Data
            db.get("SELECT SUM(capacity) as total_seats FROM armadas", (err, row) => {
              const totalSeats = row.total_seats || 100; // avoid div by 0
              db.get("SELECT SUM(seats) as booked_seats FROM bookings WHERE status != 'cancelled'", (err, row) => {
                const bookedSeats = row.booked_seats || 0;
                const occupancyData = [
                  { name: 'Occupied', value: bookedSeats },
                  { name: 'Available', value: Math.max(0, totalSeats - bookedSeats) }
                ];

                // 4. Upcoming Departures (Operational)
                // Fetch Schedules and mock time sorting for demo purposes (real would need complex day/time check)
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const todayName = dayNames[new Date().getDay()];

                const opQuery = `
                        SELECT s.*, a.name as bus, a.license_plate as plate, r.name as route
                        FROM schedules s
                        LEFT JOIN armadas a ON s.armada_id = a.id
                        LEFT JOIN routes r ON s.route_id = r.id
                        WHERE s.days LIKE ?
                        LIMIT 5
                     `;

                db.all(opQuery, [`%${todayName}%`], (err, opRows) => {
                  const upcomingDepartures = (opRows || []).map(r => ({
                    id: r.id,
                    bus: r.bus,
                    plate: r.plate || 'N/A',
                    time: r.departure_time,
                    driver_status: 'Ready', // Mocked for now
                    route: r.route
                  }));

                  // 5. Recent Transactions
                  const transQuery = `
                            SELECT bookings.*, users.name as user_name, armadas.name as armada_name 
                            FROM bookings 
                            LEFT JOIN users ON bookings.user_id = users.id
                            LEFT JOIN armadas ON bookings.armada_id = armadas.id
                            ORDER BY bookings.id DESC LIMIT 10
                         `;

                  db.all(transQuery, (err, transRows) => {
                    const formattedRows = transRows.map(r => ({
                      ...r,
                      user: { name: r.user_name },
                      armada: { name: r.armada_name }
                    }));

                    res.json({
                      totalArmadas: stats.totalArmadas,
                      totalBookings: stats.totalBookings,
                      totalUsers: stats.totalUsers,
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

// Admin: Get All Crews
app.get('/api/admin/crews', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
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
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, role, phone, assigned_bus_id } = req.body;
  db.run("INSERT INTO crews (name, role, phone, assigned_bus_id) VALUES (?, ?, ?, ?)",
    [name, role, phone, assigned_bus_id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Crew created", id: this.lastID });
    });
});

// Admin: Delete Crew
app.delete('/api/admin/crews/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.run("DELETE FROM crews WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Crew deleted" });
  });
});

// Admin: Booking Check-in
app.post('/api/admin/bookings/checkin/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.run("UPDATE bookings SET check_in_status = 'checked_in' WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Passenger checked in" });
  });
});

// Admin: Booking No-show
app.post('/api/admin/bookings/noshow/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.run("UPDATE bookings SET check_in_status = 'no_show' WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Passenger marked as no-show" });
  });
});

// Admin: Get All Bookings
app.get('/api/admin/bookings', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
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
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { user_name, date, armada_id, seats, total_price } = req.body;

  // seat_numbers stored as JSON string or comma separated
  const seatStr = Array.isArray(seats) ? seats.join(',') : seats;

  db.run("INSERT INTO bookings (passenger_name, date, armada_id, seat_numbers, seats, total_price, status, check_in_status) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 'pending')",
    [user_name, date, armada_id, seatStr, seats.length, total_price],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Manual Booking Created", id: this.lastID });
    }
  );
});

// Admin: Get All Armadas (Already exists as /api/armadas public, but maybe we want a dedicated one or just reuse)
// Admin: Create Armada
app.post('/api/admin/armadas', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, level, price_per_km, route, amenities, seat_config, history, image_path, capacity, status } = req.body;
  db.run(`INSERT INTO armadas (name, level, price_per_km, route, amenities, seat_config, history, image_path, capacity, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, level, price_per_km, route, amenities, seat_config, history, image_path, capacity, status],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Armada created", id: this.lastID });
    });
});

// Admin: Delete Armada
app.delete('/api/admin/armadas/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.run("DELETE FROM armadas WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Armada deleted" });
  });
});

// Admin: Get All Users
app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all("SELECT id, name, email, role, created_at FROM users", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// ... (User, Armada, Booking APIs)

// Routes APIs
app.get('/api/admin/routes', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  db.all("SELECT * FROM routes ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

app.post('/api/admin/routes', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { name, description, duration, color, origin, destination, coordinates, stops } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.run("INSERT INTO routes (name, description, duration, color, origin, destination, coordinates) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, description, duration, color, origin, destination, JSON.stringify(coordinates)],
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
  if (req.user.role !== 'admin') return res.sendStatus(403);
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

app.post('/api/admin/schedules', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { route_id, armada_id, days, departure_time, arrival_time, price, price_weekend, driver_id, conductor_id } = req.body;

  db.run("INSERT INTO schedules (route_id, armada_id, days, departure_time, arrival_time, price, price_weekend, driver_id, conductor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [route_id, armada_id, days, departure_time, arrival_time, price, price_weekend || (price * 1.2), driver_id, conductor_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Schedule created", id: this.lastID });
    }
  );
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
        WHERE 1=1 
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

const axios = require('axios'); // Ensure axios is required

// ... previous code ...

app.post('/api/admin/calculate-route', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);

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
      console.error("TomTom API Error:", error.response ? error.response.data : error.message);
      res.status(500).json({ error: "Failed to calculate route" });
    });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
