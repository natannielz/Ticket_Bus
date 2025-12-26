const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath);

const adminPass = bcrypt.hashSync('password', 8);
const userPass = bcrypt.hashSync('password', 8);

db.serialize(() => {
  // Check Admin
  db.get("SELECT * FROM users WHERE email = 'admin@example.com'", (err, row) => {
    if (!row) {
      console.log("Admin missing. Inserting...");
      db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ['Administrator', 'admin@example.com', adminPass, 'admin'], (err) => {
          if (err) console.error(err);
          else console.log("Admin inserted.");
        });
    } else {
      console.log("Admin exists. Reseting password...");
      db.run("UPDATE users SET password = ? WHERE email = 'admin@example.com'", [adminPass], (err) => {
        if (err) console.error(err);
        else console.log("Admin password reset.");
      });
    }
  });

  // Check User
  db.get("SELECT * FROM users WHERE email = 'user@example.com'", (err, row) => {
    if (!row) {
      console.log("User missing. Inserting...");
      db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ['Client User', 'user@example.com', userPass, 'user'], (err) => {
          if (err) console.error(err);
          else console.log("User inserted.");
        });
    } else {
      console.log("User exists. Reseting password...");
      db.run("UPDATE users SET password = ? WHERE email = 'user@example.com'", [userPass], (err) => {
        if (err) console.error(err);
        else console.log("User password reset.");
      });
    }
  });
});
