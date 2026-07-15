require('dotenv').config();
const pool = require('./config/db');
(async () => {
  try {
    const [students] = await pool.query('SELECT * FROM students WHERE email = "tanmaydevra09@gmail.com" OR student_id = "RA2311003010880"');
    console.log('Students:', students.length > 0 ? students : 'None');
    
    const [users] = await pool.query('SELECT * FROM users WHERE email = "tanmaydevra09@gmail.com" OR username = "tanmaydevra09@gmail.com"');
    console.log('Users:', users.length > 0 ? users : 'None');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
