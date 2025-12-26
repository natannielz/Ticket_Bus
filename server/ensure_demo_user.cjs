const db = require('./database.cjs');
const bcrypt = require('bcryptjs');

const email = 'user@example.com';
const password = 'password';
const hashedPassword = bcrypt.hashSync(password, 8);

db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => {
  if (err) {
    console.error(err);
    return;
  }
  if (row) {
    console.log(`User ${email} already exists (ID: ${row.id}). Ensuring role is 'user'...`);
    db.run("UPDATE users SET role = 'user' WHERE id = ?", [row.id], (err) => {
      if (err) console.error(err);
      else console.log("Updated role to 'user'.");
    });
  } else {
    console.log(`Creating user ${email}...`);
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ['Demo User', email, hashedPassword, 'user'],
      function (err) {
        if (err) console.error(err);
        else console.log(`Created user. ID: ${this.lastID}`);
      }
    );
  }
});
