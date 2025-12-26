const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to database at ' + dbPath);
});

db.serialize(() => {
  console.log('--- USERS TABLE ---');
  db.all("SELECT id, name, email, role, password FROM users", (err, rows) => {
    if (err) console.error(err);
    else {
      rows.forEach(r => {
        console.log(`User: ${r.email}, Role: ${r.role}, Hash: ${r.password.substring(0, 10)}...`);
        // Test password
        const matches = bcrypt.compareSync('password', r.password);
        console.log(`  > Password 'password' matches: ${matches}`);
      });

      if (rows.length === 0) {
        console.log("NO USERS FOUND! Attempting to seed...");
        seedUsers();
      }
    }
  });
});

function seedUsers() {
  const users = [
    {
      name: 'Administrator',
      email: 'admin@example.com',
      password: bcrypt.hashSync('password', 8),
      role: 'admin'
    },
    {
      name: 'Client User',
      email: 'user@example.com',
      password: bcrypt.hashSync('password', 8),
      role: 'user'
    }
  ];

  const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
  users.forEach(u => {
    stmt.run(u.name, u.email, u.password, u.role);
  });
  stmt.finalize();
  console.log("Seeded Users. Please restart server.");
}
