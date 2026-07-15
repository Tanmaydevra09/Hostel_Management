require('dotenv').config();
const pool = require('./config/db');
(async () => {
  try {
    const [users] = await pool.query('SELECT username, role, full_name FROM users');
    console.log(users);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
})();
