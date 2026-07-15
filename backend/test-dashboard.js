require('dotenv').config();
const pool = require('./config/db');

(async () => {
  try {
    const studentId = 1; // Assuming student ID 1 exists
    
    const [[profile]] = await pool.query(`
      SELECT s.*, r.room_number, r.block, r.floor, r.room_type 
      FROM students s 
      LEFT JOIN rooms r ON s.room_id = r.id 
      WHERE s.id = ?
    `, [studentId]);
    console.log('Profile OK');

    const [[feeSummary]] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status='Paid' THEN amount ELSE 0 END) AS total_paid,
        SUM(CASE WHEN status IN ('Pending','Overdue') THEN amount + fine_amount ELSE 0 END) AS total_pending
      FROM fees WHERE student_id = ?
    `, [studentId]);
    console.log('Fees OK');

    const [recentLeaves] = await pool.query('SELECT * FROM leave_requests WHERE student_id = ? ORDER BY submitted_at DESC LIMIT 3', [studentId]);
    console.log('Leaves OK');

    const [recentComplaints] = await pool.query('SELECT * FROM complaints WHERE student_id = ? ORDER BY submitted_at DESC LIMIT 3', [studentId]);
    console.log('Complaints OK');

    const [notices] = await pool.query('SELECT * FROM notices WHERE target_audience IN ("All", "Students") AND status = "Active" ORDER BY date_posted DESC LIMIT 5');
    console.log('Notices OK');
    
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    process.exit(0);
  }
})();
