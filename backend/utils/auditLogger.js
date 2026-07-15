const pool = require('../config/db');

/**
 * Helper to log audit actions to the database.
 * @param {Object} req - The Express request object (used to extract user info and IP)
 * @param {String} action - The action performed (e.g., 'Create', 'Update', 'Delete', 'Login')
 * @param {String} module - The module affected (e.g., 'Students', 'Rooms', 'Auth')
 * @param {String|Number} recordId - The ID of the affected record (optional)
 * @param {String} description - A human-readable description of the action
 */
const logAudit = async (req, action, module, recordId = null, description = '') => {
  try {
    let userId = null;
    let userName = 'System';
    let role = 'system';
    
    // Extract user info if available from auth middleware
    if (req && req.user) {
      userId = req.user.id || null;
      userName = req.user.full_name || req.user.username || 'Unknown';
      role = req.user.role || 'unknown';
    } else if (req && req.body && req.body.username) {
      // For login attempts before req.user is set
      userName = req.body.username;
      role = 'unauthenticated';
    }

    // Extract IP
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip) : null;

    const query = `
      INSERT INTO audit_logs 
      (user_id, user_name, role, action, module, record_id, description, ip_address) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [
      userId,
      userName,
      role,
      action,
      module,
      recordId ? String(recordId) : null,
      description,
      ipAddress ? String(ipAddress).substring(0, 45) : null
    ]);
  } catch (error) {
    // We log the error but don't throw it so it doesn't break the main flow
    console.error('Audit Logging Error:', error.message);
  }
};

module.exports = logAudit;
