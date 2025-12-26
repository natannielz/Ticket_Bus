const db = require('./database.cjs');
const fs = require('fs');
const path = require('path');

db.all("SELECT * FROM users", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    const dumpPath = path.join(__dirname, 'users_dump.json');
    fs.writeFileSync(dumpPath, JSON.stringify(rows, null, 2));
    console.log("Dumped users to " + dumpPath);
  }
});
