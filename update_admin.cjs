const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  }
});

db.run("UPDATE users SET role = 'admin'", function (err) {
  if (err) {
    console.error(err.message);
  } else {
    console.log(`Updated ${this.changes} users to admin role.`);
  }
  db.close();
});
