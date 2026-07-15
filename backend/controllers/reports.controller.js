const pool = require('../config/db');
const { generateStudentsReport, generateFeesReport } = require('../utils/pdfGenerator');

const studentsReport = async (req, res, next) => {
  try {
    const { status, department } = req.query;
    let where = ['1=1']; const params = [];
    if (status) { where.push('s.status = ?'); params.push(status); }
    if (department) { where.push('s.department = ?'); params.push(department); }

    const [students] = await pool.query(`
      SELECT s.*, r.room_number, r.block FROM students s
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE ${where.join(' AND ')} ORDER BY s.name
    `, params);

    const pdfBuffer = await generateStudentsReport(students);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=students_report.pdf' });
    res.end(pdfBuffer);
  } catch (err) { next(err); }
};

const feesReport = async (req, res, next) => {
  try {
    const { month_year, status } = req.query;
    let where = ['1=1']; const params = [];
    if (month_year) { where.push('f.month_year = ?'); params.push(month_year); }
    if (status) { where.push('f.status = ?'); params.push(status); }

    const [fees] = await pool.query(`
      SELECT f.*, s.name AS student_name, s.student_id AS student_code
      FROM fees f JOIN students s ON f.student_id = s.id
      WHERE ${where.join(' AND ')} ORDER BY f.status, s.name
    `, params);

    const [summary] = await pool.query(`
      SELECT f.status, COUNT(*) AS count, SUM(f.amount) AS total_amount, SUM(f.fine_amount) AS total_fine
      FROM fees f WHERE ${where.join(' AND ')}
      GROUP BY f.status
    `, params);

    const pdfBuffer = await generateFeesReport(fees, summary);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=fees_report.pdf' });
    res.end(pdfBuffer);
  } catch (err) { next(err); }
};

const occupancyReport = async (req, res, next) => {
  try {
    const [rooms] = await pool.query(`
      SELECT r.*, (r.capacity - r.current_occupancy) AS available_beds,
        ROUND((r.current_occupancy / r.capacity) * 100) AS occupancy_pct
      FROM rooms r ORDER BY r.block, r.room_number
    `);
    res.json({ success: true, data: rooms });
  } catch (err) { next(err); }
};

module.exports = { studentsReport, feesReport, occupancyReport };
