const db = require('./database.cjs');

console.log("Updating role for ID 2 (client@example.com)...");

db.run("UPDATE users SET role = 'user' WHERE id = 2", function (err) {
  if (err) {
    console.error("Error updating user:", err.message);
    process.exit(1);
  }

  if (this.changes > 0) {
    console.log(`Successfully updated ID 2. Role set to 'user'.`);
  } else {
    console.warn("No user found with ID 2.");
  }

  // Verify
  db.get("SELECT id, name, email, role FROM users WHERE id = 2", (err, row) => {
    if (err) {
      console.error("Verification error:", err);
    } else {
      console.log("VERIFICATION RESULT:", JSON.stringify(row, null, 2));
    }
  });
});
