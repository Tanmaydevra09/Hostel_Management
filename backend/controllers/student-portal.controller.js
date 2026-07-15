const pool = require('../config/db');

// Dashboard Overview
const getDashboard = async (req, res, next) => {
  try {
    const studentId = req.user.student_id;
    if (!studentId) return res.status(403).json({ success: false, message: 'Not linked to a student profile.' });

    const [[profile]] = await pool.query(`
      SELECT s.*, 
             r.room_number, r.block, r.floor, r.room_type, 
             r.capacity, r.current_occupancy, r.is_ac, r.gender as hostel_gender, 
             r.monthly_rent, r.maintenance_status, r.amenities
      FROM students s 
      LEFT JOIN rooms r ON s.room_id = r.id 
      WHERE s.id = ?
    `, [studentId]);

    const [roommates] = profile?.room_id ? await pool.query(`
      SELECT name, course, phone FROM students WHERE room_id = ? AND id != ?
    `, [profile.room_id, studentId]) : [[]];

    const [[feeSummary]] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status='Paid' THEN amount ELSE 0 END) AS total_paid,
        SUM(CASE WHEN status IN ('Pending','Overdue') THEN amount + fine_amount ELSE 0 END) AS total_pending
      FROM fees WHERE student_id = ?
    `, [studentId]);

    const [recentFees] = await pool.query('SELECT * FROM fees WHERE student_id = ? ORDER BY due_date DESC LIMIT 5', [studentId]);

    const [attendanceSummary] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM attendance 
      WHERE student_id = ? 
      GROUP BY status
    `, [studentId]);

    const [leaveSummary] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM leave_requests 
      WHERE student_id = ? 
      GROUP BY status
    `, [studentId]);

    const [complaintSummary] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM complaints 
      WHERE student_id = ? 
      GROUP BY status
    `, [studentId]);

    const [recentLeaves] = await pool.query('SELECT * FROM leave_requests WHERE student_id = ? ORDER BY submitted_at DESC LIMIT 3', [studentId]);
    const [recentComplaints] = await pool.query('SELECT * FROM complaints WHERE student_id = ? ORDER BY submitted_at DESC LIMIT 3', [studentId]);
    const [notices] = await pool.query('SELECT * FROM notices WHERE target_audience IN ("All", "Students") AND is_active = TRUE ORDER BY created_at DESC LIMIT 5');

    res.json({
      success: true,
      data: { profile, roommates, feeSummary, recentFees, attendanceSummary, leaveSummary, complaintSummary, recentLeaves, recentComplaints, notices }
    });
  } catch (err) { next(err); }
};

// Fees
const getFees = async (req, res, next) => {
  try {
    const [fees] = await pool.query('SELECT * FROM fees WHERE student_id = ? ORDER BY due_date DESC', [req.user.student_id]);
    res.json({ success: true, data: fees });
  } catch (err) { next(err); }
};

// Complaints
const getComplaints = async (req, res, next) => {
  try {
    const [complaints] = await pool.query('SELECT * FROM complaints WHERE student_id = ? ORDER BY submitted_at DESC', [req.user.student_id]);
    res.json({ success: true, data: complaints });
  } catch (err) { next(err); }
};

const createComplaint = async (req, res, next) => {
  try {
    const { category, description, priority } = req.body;
    await pool.query(
      'INSERT INTO complaints (student_id, category, description, priority) VALUES (?, ?, ?, ?)',
      [req.user.student_id, category, description, priority]
    );
    res.json({ success: true, message: 'Complaint submitted successfully.' });
  } catch (err) { next(err); }
};

// Leaves
const getLeaves = async (req, res, next) => {
  try {
    const [leaves] = await pool.query('SELECT * FROM leave_requests WHERE student_id = ? ORDER BY submitted_at DESC', [req.user.student_id]);
    res.json({ success: true, data: leaves });
  } catch (err) { next(err); }
};

const createLeave = async (req, res, next) => {
  try {
    const { from_date, to_date, reason, leave_type } = req.body;
    await pool.query(
      'INSERT INTO leave_requests (student_id, from_date, to_date, reason, leave_type) VALUES (?, ?, ?, ?, ?)',
      [req.user.student_id, from_date, to_date, reason, leave_type]
    );
    res.json({ success: true, message: 'Leave request submitted successfully.' });
  } catch (err) { next(err); }
};

// Profile Update
const updateProfile = async (req, res, next) => {
  try {
    const { phone, address, emergency_contact_name, emergency_contact_phone } = req.body;
    await pool.query(
      'UPDATE students SET phone = ?, address = ?, emergency_contact_name = ?, emergency_contact_phone = ? WHERE id = ?',
      [phone, address, emergency_contact_name, emergency_contact_phone, req.user.student_id]
    );
    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) { next(err); }
};

module.exports = {
  getDashboard, getFees, getComplaints, createComplaint, getLeaves, createLeave, updateProfile
};
