const pool = require('../config/db');

/**
 * GET /api/dashboard/stats
 * Returns aggregate stats for the dashboard cards.
 */
const getStats = async (req, res, next) => {
  try {
    const [[{ totalStudents }]] = await pool.query("SELECT COUNT(*) AS totalStudents FROM students WHERE status = 'Active'");
    const [[{ totalRooms }]] = await pool.query('SELECT COUNT(*) AS totalRooms FROM rooms');
    const [[{ occupiedRooms }]] = await pool.query('SELECT COUNT(*) AS occupiedRooms FROM rooms WHERE current_occupancy > 0');
    const [[{ vacantRooms }]] = await pool.query('SELECT COUNT(*) AS vacantRooms FROM rooms WHERE current_occupancy < capacity');
    const [[{ pendingFees }]] = await pool.query("SELECT COUNT(*) AS pendingFees FROM fees WHERE status IN ('Pending','Overdue')");
    const [[{ totalPendingAmount }]] = await pool.query("SELECT COALESCE(SUM(amount + fine_amount), 0) AS totalPendingAmount FROM fees WHERE status IN ('Pending','Overdue')");
    const [[{ pendingComplaints }]] = await pool.query("SELECT COUNT(*) AS pendingComplaints FROM complaints WHERE status IN ('Pending','In Progress')");
    const [[{ pendingLeave }]] = await pool.query("SELECT COUNT(*) AS pendingLeave FROM leave_requests WHERE status = 'Pending'");

    // Total revenue (all paid fees)
    const [[{ totalRevenue }]] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS totalRevenue 
      FROM fees 
      WHERE status = 'Paid'
    `);

    // Total capacity and occupancy
    const [[{ totalCapacity, totalOccupancy }]] = await pool.query(
      'SELECT SUM(capacity) AS totalCapacity, SUM(current_occupancy) AS totalOccupancy FROM rooms'
    );

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalRooms,
        occupiedRooms,
        vacantRooms,
        pendingFees,
        totalPendingAmount: parseFloat(totalPendingAmount),
        pendingComplaints,
        pendingLeave,
        totalRevenue: parseFloat(totalRevenue),
        occupancyRate: totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0,
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/recent-activity
 * Returns recent admissions, payments, and complaints.
 */
const getRecentActivity = async (req, res, next) => {
  try {
    const [recentStudents] = await pool.query(`
      SELECT id, student_id, name, course, department, room_id, admission_date, created_at
      FROM students ORDER BY created_at DESC LIMIT 5
    `);

    const [recentFees] = await pool.query(`
      SELECT f.id, f.amount, f.status, f.paid_date, f.fee_type, f.month_year,
             s.name AS student_name, s.student_id AS student_code
      FROM fees f JOIN students s ON f.student_id = s.id
      ORDER BY f.created_at DESC LIMIT 5
    `);

    const [recentComplaints] = await pool.query(`
      SELECT c.id, c.category, c.priority, c.status, c.submitted_at,
             s.name AS student_name, s.student_id AS student_code
      FROM complaints c JOIN students s ON c.student_id = s.id
      ORDER BY c.submitted_at DESC LIMIT 5
    `);

    res.json({
      success: true,
      recentStudents,
      recentFees,
      recentComplaints,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/revenue-by-gender
 * Returns total fees paid grouped by student gender.
 */
const getMonthlyRevenue = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.gender AS month,
        SUM(f.amount) AS revenue
      FROM fees f
      JOIN students s ON f.student_id = s.id
      WHERE f.status = 'Paid'
      GROUP BY s.gender
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/warden-stats
 * Returns operational stats specifically for Wardens
 */
const getWardenStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Attendance stats
    const [[attendanceStats]] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) AS presentToday,
        SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) AS absentToday,
        COUNT(*) AS totalMarked
      FROM attendance WHERE date = ?
    `, [today]);

    // Active Visitors
    const [[{ activeVisitors }]] = await pool.query('SELECT COUNT(*) AS activeVisitors FROM visitors WHERE check_out IS NULL');

    // Pending Complaints
    const [[{ pendingComplaints }]] = await pool.query("SELECT COUNT(*) AS pendingComplaints FROM complaints WHERE status IN ('Pending','In Progress')");

    // Pending Leaves
    const [[{ pendingLeave }]] = await pool.query("SELECT COUNT(*) AS pendingLeave FROM leave_requests WHERE status = 'Pending'");

    // Maintenance Rooms
    const [[{ maintenanceRooms }]] = await pool.query("SELECT COUNT(*) AS maintenanceRooms FROM rooms WHERE maintenance_status != 'Good'");

    // Vacant Rooms
    const [[{ vacantRooms }]] = await pool.query("SELECT COUNT(*) AS vacantRooms FROM rooms WHERE current_occupancy < capacity");

    res.json({
      success: true,
      stats: {
        presentToday: attendanceStats.presentToday || 0,
        absentToday: attendanceStats.absentToday || 0,
        attendancePct: attendanceStats.totalMarked > 0 ? Math.round((attendanceStats.presentToday / attendanceStats.totalMarked) * 100) : 0,
        activeVisitors,
        pendingComplaints,
        pendingLeave,
        maintenanceRooms,
        vacantRooms
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getRecentActivity, getMonthlyRevenue, getWardenStats };
