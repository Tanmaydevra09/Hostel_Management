require('dotenv').config();
const pool = require('./config/db');
(async () => {
  try {
    // Find orphaned users
    const [orphaned] = await pool.query('SELECT id, username, student_id FROM users WHERE role = "student" AND student_id IS NOT NULL AND student_id NOT IN (SELECT id FROM students)');
    console.log('Orphaned users:', orphaned);
    
    if (orphaned.length > 0) {
      const ids = orphaned.map(u => u.id);
      const [result] = await pool.query('DELETE FROM users WHERE id IN (?)', [ids]);
      console.log(`Deleted ${result.affectedRows} orphaned user(s).`);
    } else {
      console.log('No orphaned users found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
