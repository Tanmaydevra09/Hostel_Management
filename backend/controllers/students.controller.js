const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail } = require('../utils/email');
const logAudit = require('../utils/auditLogger');
const { sendToStudent } = require('../utils/notifications');

// ── Multer config for student photos ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/students');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `student_${req.params.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
}).single('photo');

// ── GET /api/students ─────────────────────────────────────────────────────────
const getAllStudents = async (req, res, next) => {
  try {
    const { search, status, department, course, year, room_id, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['1=1'];
    const params = [];

    if (search) {
      where.push('(s.name LIKE ? OR s.student_id LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    if (status) { where.push('s.status = ?'); params.push(status); }
    if (department) { where.push('s.department = ?'); params.push(department); }
    if (course) { where.push('s.course LIKE ?'); params.push(`%${course}%`); }
    if (year) { where.push('s.year = ?'); params.push(parseInt(year)); }
    if (room_id) { where.push('s.room_id = ?'); params.push(parseInt(room_id)); }

    const whereClause = where.join(' AND ');

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM students s WHERE ${whereClause}`, params);

    const [rows] = await pool.query(`
      SELECT s.*, r.room_number, r.block, r.floor
      FROM students s
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    res.json({ success: true, data: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

// ── GET /api/students/:id ─────────────────────────────────────────────────────
const getStudentById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, r.room_number, r.block, r.floor, r.room_type, r.is_ac
      FROM students s
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Fee summary
    const [[feeSummary]] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status='Paid' THEN amount ELSE 0 END) AS total_paid,
        SUM(CASE WHEN status IN ('Pending','Overdue') THEN amount + fine_amount ELSE 0 END) AS total_pending,
        COUNT(*) AS total_records
      FROM fees WHERE student_id = ?
    `, [req.params.id]);

    res.json({ success: true, data: { ...rows[0], fee_summary: feeSummary } });
  } catch (err) { next(err); }
};

// ── POST /api/students ────────────────────────────────────────────────────────
const createStudent = async (req, res, next) => {
  try {
    const {
      student_id, name, age, gender, date_of_birth, blood_group, aadhaar_number,
      phone, email, address, course, department, year, room_id,
      emergency_contact_name, emergency_contact_phone, parent_name, parent_phone, admission_date
    } = req.body;

    if (!student_id || !name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'student_id, name, email, and phone are required.' });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number must contain exactly 10 digits.' });
    }

    if (date_of_birth) {
      const birthDate = new Date(date_of_birth);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
      
      if (calculatedAge < 17) {
        return res.status(400).json({ success: false, message: 'Student must be at least 17 years old.' });
      }
    }

    const [existing] = await pool.query('SELECT id FROM students WHERE email = ? OR student_id = ? OR phone = ?', [email, student_id, phone]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'A student with this Email, Student ID, or Phone already exists.' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(`
        INSERT INTO students 
        (student_id, name, age, gender, date_of_birth, blood_group, aadhaar_number,
         phone, email, address, course, department, year, room_id,
         emergency_contact_name, emergency_contact_phone, parent_name, parent_phone, admission_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        student_id, name, age || null, gender || null, date_of_birth ? new Date(date_of_birth).toISOString().split('T')[0] : null,
        blood_group || null, aadhaar_number || null, phone || null, email,
        address || null, course || null, department || null, year || null,
        room_id || null, emergency_contact_name || null, emergency_contact_phone || null,
        parent_name || null, parent_phone || null, admission_date ? new Date(admission_date).toISOString().split('T')[0] : null
      ]);

      const newStudentId = result.insertId;

      // Update room occupancy if room_id provided
      if (room_id) {
        await connection.query('UPDATE rooms SET current_occupancy = current_occupancy + 1 WHERE id = ?', [room_id]);
        
        const [roomRows] = await connection.query('SELECT block, room_number FROM rooms WHERE id = ?', [room_id]);
        if (roomRows.length > 0) {
          await sendToStudent(
            student_id,
            'Room Assigned',
            `You have been assigned to Room ${roomRows[0].block}-${roomRows[0].room_number}.`,
            'Student',
            '/dashboard'
          );
        }
      }

      // Auto-create student user account
      const defaultPassword = `${student_id}@123`;
      const hash = await bcrypt.hash(defaultPassword, 10);
      
      await connection.query(`
        INSERT INTO users (username, password_hash, role, full_name, email, phone, student_id, password_changed)
        VALUES (?, ?, 'student', ?, ?, ?, ?, FALSE)
      `, [email, hash, name, email, phone || null, newStudentId]);

      await connection.commit();

      try {
        await sendWelcomeEmail(email, name, defaultPassword);
        res.status(201).json({ success: true, message: 'Student and account created successfully. Welcome email sent.', id: newStudentId });
      } catch (emailErr) {
        // We log the error but still return success because the student was successfully created
        console.error('[EMAIL ERROR] Failed to send welcome email:', emailErr);
        
        await logAudit(req, 'Create', 'Students', newStudentId, `Added student: ${name} (${student_id})`);
        
        res.status(201).json({ success: true, message: 'Student created successfully, but failed to send welcome email.', id: newStudentId });
      }
      
      // Log success if email didn't throw
      await logAudit(req, 'Create', 'Students', newStudentId, `Added student: ${name} (${student_id})`);
      
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) { 
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A student with this Email or Student ID already exists.' });
    }
    next(err); 
  }
};

// ── PUT /api/students/:id ─────────────────────────────────────────────────────
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get old room_id
    const [old] = await pool.query('SELECT room_id FROM students WHERE id = ?', [id]);
    if (old.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });

    const {
      name, age, gender, date_of_birth, blood_group, aadhaar_number,
      phone, email, address, course, department, year, room_id,
      emergency_contact_name, emergency_contact_phone, parent_name, parent_phone,
      admission_date, status
    } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Phone number must contain exactly 10 digits.' });
    }

    if (date_of_birth) {
      const birthDate = new Date(date_of_birth);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
      
      if (calculatedAge < 17) {
        return res.status(400).json({ success: false, message: 'Student must be at least 17 years old.' });
      }
    }
    
    const [existing] = await pool.query('SELECT id FROM students WHERE (email = ? OR phone = ?) AND id != ?', [email, phone, id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'A student with this Email or Phone already exists.' });
    }

    await pool.query(`
      UPDATE students SET
        name=?, age=?, gender=?, date_of_birth=?, blood_group=?, aadhaar_number=?,
        phone=?, email=?, address=?, course=?, department=?, year=?, room_id=?,
        emergency_contact_name=?, emergency_contact_phone=?, parent_name=?, parent_phone=?,
        admission_date=?, status=?
      WHERE id=?
    `, [
      name, age || null, gender || null, date_of_birth ? new Date(date_of_birth).toISOString().split('T')[0] : null,
      blood_group || null, aadhaar_number || null, phone || null, email || null,
      address || null, course || null, department || null, year || null,
      room_id || null, emergency_contact_name || null, emergency_contact_phone || null,
      parent_name || null, parent_phone || null, admission_date ? new Date(admission_date).toISOString().split('T')[0] : null, status || 'Active', id
    ]);

    // Update room occupancy if room changed
    const oldRoomId = old[0].room_id;
    const newRoomId = room_id || null;
    if (oldRoomId !== newRoomId) {
      if (oldRoomId) await pool.query('UPDATE rooms SET current_occupancy = GREATEST(0, current_occupancy - 1) WHERE id = ?', [oldRoomId]);
      if (newRoomId) {
        await pool.query('UPDATE rooms SET current_occupancy = current_occupancy + 1 WHERE id = ?', [newRoomId]);
        
        const [roomRows] = await pool.query('SELECT block, room_number FROM rooms WHERE id = ?', [newRoomId]);
        if (roomRows.length > 0) {
          // fetch student_id to notify
          const [stuRows] = await pool.query('SELECT student_id FROM students WHERE id = ?', [id]);
          if (stuRows.length > 0) {
            await sendToStudent(
              stuRows[0].student_id,
              'Room Reassigned',
              `Your accommodation has been updated to Room ${roomRows[0].block}-${roomRows[0].room_number}.`,
              'Student',
              '/dashboard'
            );
          }
        }
      }
    }

    await logAudit(req, 'Update', 'Students', id, `Updated student details for ID ${id}`);

    res.json({ success: true, message: 'Student updated successfully.' });
  } catch (err) { next(err); }
};

// ── DELETE /api/students/:id ──────────────────────────────────────────────────
const deleteStudent = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const [rows] = await pool.query('SELECT room_id FROM students WHERE id = ?', [studentId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });

    const roomId = rows[0].room_id;
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Delete associated user account to free up the email/student_id
      await connection.query('DELETE FROM users WHERE student_id = ?', [studentId]);
      
      // 2. Delete the student record (associated fees/complaints cascade)
      await connection.query('DELETE FROM students WHERE id = ?', [studentId]);

      // 3. Update room occupancy
      if (roomId) {
        await connection.query('UPDATE rooms SET current_occupancy = GREATEST(0, current_occupancy - 1) WHERE id = ?', [roomId]);
      }

      await connection.commit();
      
      await logAudit(req, 'Delete', 'Students', studentId, `Deleted student ID ${studentId}`);
      
      res.json({ success: true, message: 'Student and corresponding account deleted successfully.' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) { next(err); }
};

// ── POST /api/students/:id/photo ──────────────────────────────────────────────
const uploadPhoto = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    try {
      const photoPath = `/uploads/students/${req.file.filename}`;
      await pool.query('UPDATE students SET photo_path = ? WHERE id = ?', [photoPath, req.params.id]);
      res.json({ success: true, photo_path: photoPath });
    } catch (e) { next(e); }
  });
};

// ── GET /api/students/meta/filters ───────────────────────────────────────────
const getFilterOptions = async (req, res, next) => {
  try {
    const [departments] = await pool.query('SELECT DISTINCT department FROM students WHERE department IS NOT NULL ORDER BY department');
    const [courses] = await pool.query('SELECT DISTINCT course FROM students WHERE course IS NOT NULL ORDER BY course');
    res.json({ success: true, departments: departments.map(d => d.department), courses: courses.map(c => c.course) });
  } catch (err) { next(err); }
};

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent, uploadPhoto, getFilterOptions };
