require('dotenv').config();
const pool = require('./config/db');
(async () => {
  try {
    console.log("Truncating notifications...");
    await pool.query("TRUNCATE TABLE notifications");
    
    console.log("Updating ENUM...");
    await pool.query("ALTER TABLE notifications MODIFY COLUMN type ENUM('Complaint', 'Fee', 'Leave', 'Student', 'Visitor', 'System') DEFAULT 'System'");
    
    console.log("Adding reference_url...");
    try {
      await pool.query("ALTER TABLE notifications ADD COLUMN reference_url VARCHAR(255) DEFAULT NULL");
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
    
    console.log("Success");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
