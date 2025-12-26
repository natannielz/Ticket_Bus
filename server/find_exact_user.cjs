const db = require('./database.cjs');

console.log("Searching for user@example.com...");

db.get("SELECT * FROM users WHERE email = 'user@example.com'", (err, row) => {
  if (err) {
    console.error("DB Error:", err);
  } else if (!row) {
    console.log("USER NOT FOUND: 'user@example.com'");
    // let's list all users to see what's there
    db.all("SELECT id, email, role FROM users", (err, rows) => {
      console.log("ALL USERS:", JSON.stringify(rows));
    });
  } else {
    console.log("USER FOUND:");
    console.log("ID:", row.id);
    console.log("Email:", row.email);
    console.log("Role:", row.role);
    console.log("Password Hash:", row.password.substring(0, 10) + "...");
  }
});
