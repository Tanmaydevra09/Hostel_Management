const pool = require('../config/db');

/**
 * Send a notification to a specific user.
 * @param {number} userId - The ID of the user (admin, warden, or student's user ID)
 * @param {string} title - The notification title
 * @param {string} message - The notification body
 * @param {string} type - 'Complaint', 'Fee', 'Leave', 'Student', 'Visitor', or 'System'
 * @param {string} referenceUrl - Optional URL path for the notification link
 */
const sendNotification = async (userId, title, message, type = 'System', referenceUrl = null) => {
  try {
    if (!userId) return;
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, reference_url) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, message, type, referenceUrl]
    );
  } catch (err) {
    console.error('Failed to send notification:', err.message);
  }
};

/**
 * Broadcast a notification to all Admins and Wardens.
 */
const sendToWardensAndAdmins = async (title, message, type = 'System', referenceUrl = null) => {
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE role IN ("admin", "warden") AND is_active = TRUE');
    const values = users.map(u => [u.id, title, message, type, referenceUrl]);
    
    if (values.length > 0) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_url) VALUES ?`,
        [values]
      );
    }
  } catch (err) {
    console.error('Failed to broadcast to wardens:', err.message);
  }
};

/**
 * Send a notification to a specific student (resolving their user_id via their student_id).
 */
const sendToStudent = async (studentId, title, message, type = 'System', referenceUrl = null) => {
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE student_id = ? AND is_active = TRUE', [studentId]);
    if (users.length > 0) {
      await sendNotification(users[0].id, title, message, type, referenceUrl);
    }
  } catch (err) {
    console.error('Failed to send notification to student:', err.message);
  }
};

/**
 * Broadcast a notification to ALL active users (admins, wardens, and students).
 */
const sendToAllActiveUsers = async (title, message, type = 'System', referenceUrl = null) => {
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE is_active = TRUE');
    const values = users.map(u => [u.id, title, message, type, referenceUrl]);
    if (values.length > 0) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_url) VALUES ?`,
        [values]
      );
    }
  } catch (err) {
    console.error('Failed to broadcast to all users:', err.message);
  }
};

module.exports = { sendNotification, sendToWardensAndAdmins, sendToStudent, sendToAllActiveUsers };
