const db = require('./database.cjs');

db.all("SELECT id, name, email, role FROM users", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log("ALL USERS:");
    console.log(JSON.stringify(rows, null, 2));
  }
});
