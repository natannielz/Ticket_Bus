const db = require('./database.cjs');

db.all("SELECT id, name, email, role FROM users", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log("ALL USERS CLEAN LIST:");
    rows.forEach(r => {
      console.log(`ID: ${r.id} | Email: '${r.email}' | Role: '${r.role}'`);
    });
  }
});
