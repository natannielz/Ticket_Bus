const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = "supersecretkey"; // In production, use environment variable

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
  db.all("SELECT * FROM bookings WHERE user_id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
