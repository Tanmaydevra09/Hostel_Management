const pool = require('../config/db');
const logAudit = require('../utils/auditLogger');

const getAttendance = async (req, res, next) => {
  try {
    const { date, student_id, status } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    let where = ['a.date = ?']; const params = [targetDate];
    if (student_id) { where.push('a.student_id = ?'); params.push(parseInt(student_id)); }
    if (status) { where.push('a.status = ?'); params.push(status); }

    const [rows] = await pool.query(`
      SELECT a.*, s.name AS student_name, s.student_id AS student_code, r.room_number
      FROM attendance a JOIN students s ON a.student_id = s.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE ${where.join(' AND ')} ORDER BY s.name
    `, params);

    // Stats for the day
    const [[stats]] = await pool.query(`
      SELECT 
        SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN a.status='Absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN a.status='On Leave' THEN 1 ELSE 0 END) AS on_leave,
        COUNT(*) AS total
      FROM attendance a WHERE a.date = ?
    `, [targetDate]);

    res.json({ success: true, data: rows, stats, date: targetDate });
  } catch (err) { next(err); }
};

const markAttendance = async (req, res, next) => {
  try {
    const { records, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];
    if (!records || !Array.isArray(records)) return res.status(400).json({ success: false, message: 'records array required.' });

    for (const rec of records) {
      await pool.query(`
        INSERT INTO attendance (student_id, date, status, check_in_time, check_out_time, marked_by, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status=VALUES(status), check_in_time=VALUES(check_in_time), check_out_time=VALUES(check_out_time), marked_by=VALUES(marked_by)
      `, [rec.student_id, targetDate, rec.status || 'Present', rec.check_in_time || null, rec.check_out_time || null, req.user.full_name || req.user.username, rec.remarks || null]);
    }
    
    await logAudit(req, 'Create', 'Attendance', null, `Marked attendance for ${records.length} students on ${targetDate}`);

    res.json({ success: true, message: `Attendance marked for ${records.length} students.` });
  } catch (err) { next(err); }
};

const getReport = async (req, res, next) => {
  try {
    const { from_date, to_date, student_id } = req.query;
    let where = ['1=1']; const params = [];
    if (from_date) { where.push('a.date >= ?'); params.push(from_date); }
    if (to_date) { where.push('a.date <= ?'); params.push(to_date); }
    if (student_id) { where.push('a.student_id = ?'); params.push(parseInt(student_id)); }

    const [rows] = await pool.query(`
      SELECT s.name, s.student_id AS student_code,
        SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) AS present_days,
        SUM(CASE WHEN a.status='Absent' THEN 1 ELSE 0 END) AS absent_days,
        SUM(CASE WHEN a.status='On Leave' THEN 1 ELSE 0 END) AS leave_days,
        COUNT(*) AS total_days,
        ROUND(SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS attendance_pct
      FROM attendance a JOIN students s ON a.student_id = s.id
      WHERE ${where.join(' AND ')}
      GROUP BY a.student_id ORDER BY s.name
    `, params);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

module.exports = { getAttendance, markAttendance, getReport };
