const pool = require('../config/db');
const logAudit = require('../utils/auditLogger');
const { sendToWardensAndAdmins, sendToStudent } = require('../utils/notifications');

const getAll = async (req, res, next) => {
  try {
    const { status, category, priority, student_id, search } = req.query;
    let where = ['1=1']; const params = [];
    if (search) { where.push('(s.name LIKE ? OR c.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (status) { where.push('c.status = ?'); params.push(status); }
    if (category) { where.push('c.category = ?'); params.push(category); }
    if (priority) { where.push('c.priority = ?'); params.push(priority); }
    if (student_id) { where.push('c.student_id = ?'); params.push(parseInt(student_id)); }

    const [rows] = await pool.query(`
      SELECT c.*, s.name AS student_name, s.student_id AS student_code, r.room_number, r.block
      FROM complaints c JOIN students s ON c.student_id = s.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE ${where.join(' AND ')} ORDER BY 
        FIELD(c.priority,'Critical','High','Medium','Low'), c.submitted_at DESC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { student_id, category, description, priority } = req.body;
    if (!student_id || !description) return res.status(400).json({ success: false, message: 'student_id and description are required.' });
    const [result] = await pool.query(
      'INSERT INTO complaints (student_id, category, description, priority) VALUES (?, ?, ?, ?)',
      [student_id, category || 'Other', description, priority || 'Medium']
    );
    
    await logAudit(req, 'Create', 'Complaints', result.insertId, `Submitted ${priority || 'Medium'} priority complaint for student ID ${student_id}`);
    await sendToWardensAndAdmins(
      'New Complaint Filed',
      `A new ${priority || 'Medium'} priority complaint (${category || 'Other'}) has been submitted.`,
      'Complaint',
      '/complaints'
    );
    
    res.status(201).json({ success: true, message: 'Complaint submitted.', id: result.insertId });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, priority, assigned_to, resolution_notes } = req.body;
    const resolved_at = status === 'Resolved' ? new Date() : null;
    await pool.query(
      'UPDATE complaints SET status=?, priority=COALESCE(?,priority), assigned_to=COALESCE(?,assigned_to), resolution_notes=COALESCE(?,resolution_notes), resolved_at=? WHERE id=?',
      [status, priority, assigned_to, resolution_notes, resolved_at, req.params.id]
    );
    
    await logAudit(req, 'Update', 'Complaints', req.params.id, `Updated complaint status to ${status}`);
    
    // Fetch student_id to notify the student
    const [complaintRows] = await pool.query('SELECT student_id FROM complaints WHERE id = ?', [req.params.id]);
    if (complaintRows.length > 0) {
      await sendToStudent(
        complaintRows[0].student_id,
        `Complaint Status Updated`,
        `Your complaint status has been updated to ${status}.`,
        'Complaint',
        '/complaints'
      );
    }
    
    res.json({ success: true, message: 'Complaint updated.' });
  } catch (err) { next(err); }
};

const deleteComplaint = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM complaints WHERE id = ?', [req.params.id]);
    
    await logAudit(req, 'Delete', 'Complaints', req.params.id, `Deleted complaint ID ${req.params.id}`);
    
    res.json({ success: true, message: 'Complaint deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, create, updateStatus, deleteComplaint };
