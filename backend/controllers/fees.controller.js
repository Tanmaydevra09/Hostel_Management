const pool = require('../config/db');
const { generateFeeReceipt } = require('../utils/pdfGenerator');
const logAudit = require('../utils/auditLogger');
const { sendToStudent } = require('../utils/notifications');

// Fine per day for overdue fees
const FINE_PER_DAY = 50;

// ── GET /api/fees ─────────────────────────────────────────────────────────────
const getAllFees = async (req, res, next) => {
  try {
    const { search, status, fee_type, month_year, student_id, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['1=1'];
    const params = [];

    if (search) {
      where.push('(s.name LIKE ? OR s.student_id LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) { where.push('f.status = ?'); params.push(status); }
    if (fee_type) { where.push('f.fee_type = ?'); params.push(fee_type); }
    if (month_year) { where.push('f.month_year = ?'); params.push(month_year); }
    if (student_id) { where.push('f.student_id = ?'); params.push(parseInt(student_id)); }

    const whereClause = where.join(' AND ');
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM fees f JOIN students s ON f.student_id = s.id WHERE ${whereClause}`, params);

    const [rows] = await pool.query(`
      SELECT f.*, s.name AS student_name, s.student_id AS student_code, s.phone AS student_phone
      FROM fees f JOIN students s ON f.student_id = s.id
      WHERE ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Auto-calculate fine for overdue records
    const today = new Date();
    const enriched = rows.map(fee => {
      let fine = parseFloat(fee.fine_amount) || 0;
      if (fee.status === 'Pending' && fee.due_date && new Date(fee.due_date) < today) {
        const daysOverdue = Math.floor((today - new Date(fee.due_date)) / (1000 * 60 * 60 * 24));
        fine = daysOverdue * FINE_PER_DAY;
      }
      return { ...fee, computed_fine: fine, total_due: parseFloat(fee.amount) + fine };
    });

    res.json({ success: true, data: enriched, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

// ── GET /api/fees/:id ─────────────────────────────────────────────────────────
const getFeeById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, s.name AS student_name, s.student_id AS student_code, 
             s.phone, s.email, s.course, s.department,
             r.room_number, r.block
      FROM fees f 
      JOIN students s ON f.student_id = s.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE f.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Fee record not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// ── POST /api/fees ────────────────────────────────────────────────────────────
const createFee = async (req, res, next) => {
  try {
    const { student_id, amount, due_date, fee_type, month_year, payment_mode, transaction_id, remarks } = req.body;

    if (!student_id || !amount) {
      return res.status(400).json({ success: false, message: 'student_id and amount are required.' });
    }

    const [result] = await pool.query(`
      INSERT INTO fees (student_id, amount, due_date, fee_type, month_year, payment_mode, transaction_id, remarks, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `, [
      student_id, amount, due_date || null, fee_type || 'Hostel Fee',
      month_year || null, payment_mode || null, transaction_id || null, remarks || null
    ]);

    await logAudit(req, 'Create', 'Fees', result.insertId, `Added fee record of ₹${amount} for student ID ${student_id}`);

    await sendToStudent(
      student_id,
      'New Fee Added',
      `A new ${fee_type || 'fee'} of ₹${amount} has been added to your account.`,
      'Fee',
      '/fees'
    );

    res.status(201).json({ success: true, message: 'Fee record created.', id: result.insertId });
  } catch (err) { next(err); }
};

// ── PUT /api/fees/:id/pay ─────────────────────────────────────────────────────
const markAsPaid = async (req, res, next) => {
  try {
    const { payment_mode, transaction_id, remarks, fine_amount } = req.body;

    await pool.query(`
      UPDATE fees SET status='Paid', paid_date=CURDATE(), 
        payment_mode=?, transaction_id=?, remarks=?, fine_amount=COALESCE(?, fine_amount)
      WHERE id=?
    `, [payment_mode || 'Cash', transaction_id || null, remarks || null, fine_amount, req.params.id]);

    await logAudit(req, 'Update', 'Fees', req.params.id, `Marked fee ID ${req.params.id} as Paid`);

    const [feeRows] = await pool.query('SELECT student_id, amount FROM fees WHERE id = ?', [req.params.id]);
    if (feeRows.length > 0) {
      await sendToStudent(
        feeRows[0].student_id,
        'Payment Successful',
        `Your payment of ₹${feeRows[0].amount} has been successfully recorded.`,
        'Fee',
        '/fees'
      );
    }

    res.json({ success: true, message: 'Fee marked as paid.' });
  } catch (err) { next(err); }
};

// ── PUT /api/fees/:id ─────────────────────────────────────────────────────────
const updateFee = async (req, res, next) => {
  try {
    const { amount, due_date, fee_type, month_year, status, fine_amount, payment_mode, transaction_id, remarks } = req.body;

    await pool.query(`
      UPDATE fees SET amount=?, due_date=?, fee_type=?, month_year=?, status=?,
        fine_amount=?, payment_mode=?, transaction_id=?, remarks=?
      WHERE id=?
    `, [amount, due_date || null, fee_type, month_year || null, status, fine_amount || 0, payment_mode || null, transaction_id || null, remarks || null, req.params.id]);

    await logAudit(req, 'Update', 'Fees', req.params.id, `Updated details for fee ID ${req.params.id}`);

    res.json({ success: true, message: 'Fee record updated.' });
  } catch (err) { next(err); }
};

// ── DELETE /api/fees/:id ──────────────────────────────────────────────────────
const deleteFee = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM fees WHERE id = ?', [req.params.id]);
    
    await logAudit(req, 'Delete', 'Fees', req.params.id, `Deleted fee ID ${req.params.id}`);
    
    res.json({ success: true, message: 'Fee record deleted.' });
  } catch (err) { next(err); }
};

// ── GET /api/fees/:id/receipt (PDF) ──────────────────────────────────────────
const downloadReceipt = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, s.name AS student_name, s.student_id AS student_code, 
             s.course, s.department, s.phone, r.room_number, r.block
      FROM fees f 
      JOIN students s ON f.student_id = s.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE f.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Fee record not found.' });

    const fee = rows[0];
    const pdfBuffer = await generateFeeReceipt(fee);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=receipt_${fee.student_code}_${fee.month_year || fee.id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err) { next(err); }
};

// ── GET /api/fees/report/monthly ──────────────────────────────────────────────
const getMonthlyReport = async (req, res, next) => {
  try {
    const { month_year } = req.query;
    let where = '1=1';
    const params = [];
    if (month_year) { where += ' AND f.month_year = ?'; params.push(month_year); }

    const [summary] = await pool.query(`
      SELECT 
        f.status,
        COUNT(*) AS count,
        SUM(f.amount) AS total_amount,
        SUM(f.fine_amount) AS total_fine
      FROM fees f WHERE ${where}
      GROUP BY f.status
    `, params);

    const [details] = await pool.query(`
      SELECT f.*, s.name AS student_name, s.student_id AS student_code, r.room_number
      FROM fees f JOIN students s ON f.student_id = s.id
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE ${where}
      ORDER BY f.status, s.name
    `, params);

    res.json({ success: true, summary, details });
  } catch (err) { next(err); }
};

module.exports = { getAllFees, getFeeById, createFee, updateFee, markAsPaid, deleteFee, downloadReceipt, getMonthlyReport };
