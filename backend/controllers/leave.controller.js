const pool = require('../config/db');
const logAudit = require('../utils/auditLogger');
const { sendToWardensAndAdmins, sendToStudent } = require('../utils/notifications');

const getAll = async (req, res, next) => {
  try {
    const { status, student_id } = req.query;
    let where = ['1=1']; const params = [];
    if (status) { where.push('l.status = ?'); params.push(status); }
    if (student_id) { where.push('l.student_id = ?'); params.push(parseInt(student_id)); }

    const [rows] = await pool.query(`
      SELECT l.*, s.name AS student_name, s.student_id AS student_code, r.room_number
      FROM leave_requests l JOIN students s ON l.student_id = s.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE ${where.join(' AND ')} ORDER BY l.submitted_at DESC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { student_id, from_date, to_date, reason, leave_type } = req.body;
    if (!student_id || !from_date || !to_date || !reason)
      return res.status(400).json({ success: false, message: 'student_id, from_date, to_date, reason required.' });
    const [result] = await pool.query(
      'INSERT INTO leave_requests (student_id, from_date, to_date, reason, leave_type) VALUES (?, ?, ?, ?, ?)',
      [student_id, from_date, to_date, reason, leave_type || 'Personal']
    );
    
    await logAudit(req, 'Create', 'Leave', result.insertId, `Submitted leave request for student ID ${student_id} from ${from_date} to ${to_date}`);
    await sendToWardensAndAdmins(
      'New Leave Request',
      `A new leave request has been submitted from ${from_date} to ${to_date}.`,
      'Leave',
      '/leave'
    );
    
    res.status(201).json({ success: true, message: 'Leave request submitted.', id: result.insertId });
  } catch (err) { next(err); }
};

const review = async (req, res, next) => {
  try {
    const { status, review_remarks } = req.body;
    if (!['Approved', 'Rejected'].includes(status))
      return res.status(400).json({ success: false, message: "status must be 'Approved' or 'Rejected'." });

    await pool.query(
      "UPDATE leave_requests SET status=?, reviewed_by=?, review_remarks=?, reviewed_at=NOW() WHERE id=?",
      [status, req.user.full_name || req.user.username, review_remarks || null, req.params.id]
    );
    
    await logAudit(req, 'Update', 'Leave', req.params.id, `${status} leave request ID ${req.params.id}`);
    
    // Fetch student_id to notify the student
    const [leaveRows] = await pool.query('SELECT student_id FROM leave_requests WHERE id = ?', [req.params.id]);
    if (leaveRows.length > 0) {
      await sendToStudent(
        leaveRows[0].student_id,
        `Leave Request ${status}`,
        `Your leave request has been ${status.toLowerCase()} by ${req.user.full_name || req.user.username}.`,
        'Leave',
        '/leave'
      );
    }
    
    res.json({ success: true, message: `Leave request ${status.toLowerCase()}.` });
  } catch (err) { next(err); }
};

const deleteLeave = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM leave_requests WHERE id = ?', [req.params.id]);
    
    await logAudit(req, 'Delete', 'Leave', req.params.id, `Deleted leave request ID ${req.params.id}`);
    
    res.json({ success: true, message: 'Leave request deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, create, review, deleteLeave };
