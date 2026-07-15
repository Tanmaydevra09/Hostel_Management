const pool = require('../config/db');
const logAudit = require('../utils/auditLogger');

const getAll = async (req, res, next) => {
  try {
    const { student_id, date, active_only } = req.query;
    let where = ['1=1']; const params = [];
    if (student_id) { where.push('v.student_id = ?'); params.push(parseInt(student_id)); }
    if (date) { where.push('DATE(v.check_in) = ?'); params.push(date); }
    if (active_only === 'true') where.push('v.check_out IS NULL');

    const [rows] = await pool.query(`
      SELECT v.*, s.name AS student_name, s.student_id AS student_code, r.room_number
      FROM visitors v JOIN students s ON v.student_id = s.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE ${where.join(' AND ')} ORDER BY v.check_in DESC
    `, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { student_id, visitor_name, relation, phone, id_proof_type, id_proof_number, purpose, approved_by } = req.body;
    if (!student_id || !visitor_name) return res.status(400).json({ success: false, message: 'student_id and visitor_name required.' });
    const [result] = await pool.query(
      'INSERT INTO visitors (student_id, visitor_name, relation, phone, id_proof_type, id_proof_number, purpose, approved_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student_id, visitor_name, relation || null, phone || null, id_proof_type || null, id_proof_number || null, purpose || null, approved_by || null]
    );
    
    await logAudit(req, 'Create', 'Visitors', result.insertId, `Checked in visitor ${visitor_name} for student ID ${student_id}`);
    
    res.status(201).json({ success: true, message: 'Visitor checked in.', id: result.insertId });
  } catch (err) { next(err); }
};

const checkout = async (req, res, next) => {
  try {
    await pool.query('UPDATE visitors SET check_out = NOW() WHERE id = ?', [req.params.id]);
    
    await logAudit(req, 'Update', 'Visitors', req.params.id, `Checked out visitor ID ${req.params.id}`);
    
    res.json({ success: true, message: 'Visitor checked out.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, create, checkout };
