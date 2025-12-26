const db = require('./database.cjs');

db.get("SELECT * FROM users WHERE email = 'user@example.com'", (err, row) => {
  if (err) {
    console.error(err);
  } else {
    console.log("USER CHECK RESULT:");
    console.log(JSON.stringify(row, null, 2));
  }
});
