const db = require('./database.cjs');

db.get("SELECT * FROM users WHERE id = 9", (err, row) => {
  if (err) {
    console.error(err);
  } else {
    console.log("USER 9 DETAILS:");
    console.log(JSON.stringify(row, null, 2));
  }
});
