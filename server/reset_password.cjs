const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const hashedPassword = bcrypt.hashSync('password', 8);

console.log("--- Resetting Passwords ---");

db.serialize(() => {
  // force admin update
  db.run("UPDATE users SET password = ? WHERE id = 1", [hashedPassword], function (err) {
    if (err) console.error("Admin Update Error:", err);
    else console.log(`Admin update executed. Changes: ${this.changes}`);
  });

  // force user update
  db.run("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, 'user@example.com'], function (err) {
    if (err) console.error("User Update Error:", err);
    else console.log(`User update executed. Changes: ${this.changes}`);
  });
});

db.close(() => {
  console.log("--- Finished ---");
});
