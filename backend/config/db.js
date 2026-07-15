const mysql = require('mysql2/promise');

// PlanetScale (and other cloud MySQL hosts) require SSL
const sslConfig = process.env.DB_SSL === 'true'
  ? { ssl: { rejectUnauthorized: false } }
  : {};

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'YES',
  database: process.env.DB_NAME     || 'hostel_management',
  waitForConnections: true,
  connectionLimit:    5,   // stay within PlanetScale free-tier limits
  queueLimit:         0,
  timezone:           '+05:30',
  ...sslConfig,
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
  }
})();

module.exports = pool;
