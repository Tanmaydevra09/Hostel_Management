const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendOtpEmail } = require('../utils/email');
const logAudit = require('../utils/auditLogger');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const [rows] = await pool.query(
      `SELECT u.* FROM users u
       LEFT JOIN students s ON u.student_id = s.id
       WHERE (u.username = ? OR s.student_id = ? OR u.email = ?) AND u.is_active = TRUE`,
      [username, username, username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    if (!user.email) {
      return res.status(400).json({ success: false, message: 'No registered email found for OTP verification.' });
    }

    if (user.role === 'student' && !user.password_changed) {
      return res.json({
        success: true,
        forcePasswordChange: true,
        userId: user.id
      });
    }

    // Invalidate old OTPs
    await pool.query('UPDATE user_otps SET verified = TRUE WHERE user_id = ? AND verified = FALSE', [user.id]);

    // Generate and save new OTP
    const otp = generateOTP();
    await pool.query(
      'INSERT INTO user_otps (user_id, otp, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
      [user.id, otp]
    );

    // Send email
    await sendOtpEmail(user.email, otp, user.full_name);

    res.json({
      success: true,
      message: 'OTP sent to registered email.',
      otpRequired: true,
      userId: user.id,
      email: user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length)) // mask email
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ success: false, message: 'User ID and OTP are required.' });
    }

    const [otps] = await pool.query(
      'SELECT * FROM user_otps WHERE user_id = ? AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (otps.length === 0) {
      return res.status(400).json({ success: false, message: 'No active OTP found. Please request a new one.' });
    }

    const currentOtp = otps[0];

    // Check expiration
    if (new Date(currentOtp.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Check attempts
    if (currentOtp.attempts >= 5) {
      await pool.query('UPDATE user_otps SET verified = TRUE WHERE id = ?', [currentOtp.id]);
      return res.status(400).json({ success: false, message: 'Maximum attempts reached. Please request a new OTP.' });
    }

    // Check correctness
    if (currentOtp.otp !== otp) {
      await pool.query('UPDATE user_otps SET attempts = attempts + 1 WHERE id = ?', [currentOtp.id]);
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    // OTP is correct
    await pool.query('UPDATE user_otps SET verified = TRUE WHERE id = ?', [currentOtp.id]);

    // Fetch user and issue JWT
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name, student_id: user.student_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        email: user.email,
        student_id: user.student_id,
      },
    });
    
    // Log audit
    // Manually pass req with injected user so logger picks it up
    req.user = user;
    await logAudit(req, 'Login', 'Auth', user.id, 'User logged in successfully via OTP');
    
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/resend-otp
 */
const resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required.' });

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    const user = users[0];

    // Check if last OTP was generated < 30 seconds ago
    const [lastOtps] = await pool.query(
      'SELECT created_at FROM user_otps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (lastOtps.length > 0) {
      const timeDiff = (new Date() - new Date(lastOtps[0].created_at)) / 1000;
      if (timeDiff < 30) {
        return res.status(429).json({ success: false, message: 'Please wait 30 seconds before resending.' });
      }
    }

    // Invalidate old OTPs
    await pool.query('UPDATE user_otps SET verified = TRUE WHERE user_id = ? AND verified = FALSE', [userId]);

    const otp = generateOTP();
    await pool.query(
      'INSERT INTO user_otps (user_id, otp, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
      [userId, otp]
    );

    await sendOtpEmail(user.email, otp, user.full_name);

    res.json({ success: true, message: 'A new OTP has been sent to your email.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);

    await logAudit(req, 'Update', 'Auth', userId, 'User changed their password');

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/force-change-password
 */
const forceChangePassword = async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ success: false, message: 'User ID and new password are required.' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ?, password_changed = TRUE WHERE id = ?', [hash, userId]);
    
    // Pass user manually
    req.user = { id: userId, full_name: 'System', role: 'system' };
    await logAudit(req, 'Update', 'Auth', userId, 'User forced to change password on first login');

    res.json({ success: true, message: 'Password changed successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'Email not found.' });
    const user = users[0];
    
    await pool.query('UPDATE user_otps SET verified = TRUE WHERE user_id = ? AND verified = FALSE', [user.id]);
    const otp = generateOTP();
    await pool.query('INSERT INTO user_otps (user_id, otp, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))', [user.id, otp]);
    await sendOtpEmail(user.email, otp, user.full_name);
    
    res.json({ success: true, message: 'OTP sent to email.', userId: user.id });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { userId, otp, newPassword } = req.body;
    if (!userId || !otp || !newPassword) return res.status(400).json({ success: false, message: 'All fields are required.' });

    const [otps] = await pool.query('SELECT * FROM user_otps WHERE user_id = ? AND verified = FALSE ORDER BY created_at DESC LIMIT 1', [userId]);
    if (otps.length === 0) return res.status(400).json({ success: false, message: 'No active OTP found.' });
    
    const currentOtp = otps[0];
    if (new Date(currentOtp.expires_at) < new Date()) return res.status(400).json({ success: false, message: 'OTP expired.' });
    if (currentOtp.attempts >= 5) {
      await pool.query('UPDATE user_otps SET verified = TRUE WHERE id = ?', [currentOtp.id]);
      return res.status(400).json({ success: false, message: 'Max attempts reached.' });
    }
    if (currentOtp.otp !== otp) {
      await pool.query('UPDATE user_otps SET attempts = attempts + 1 WHERE id = ?', [currentOtp.id]);
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    
    await pool.query('UPDATE user_otps SET verified = TRUE WHERE id = ?', [currentOtp.id]);
    
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ?, password_changed = TRUE WHERE id = ?', [hash, userId]);
    
    req.user = { id: userId, full_name: 'System', role: 'system' };
    await logAudit(req, 'Update', 'Auth', userId, 'User reset their password via Forgot Password flow');

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, role, full_name, email, phone, student_id, last_login FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/create-user  (admin only)
 */
const createUser = async (req, res, next) => {
  try {
    const { username, password, role, full_name, email, phone, student_id } = req.body;

    if (!username || !password || !role || !full_name) {
      return res.status(400).json({ success: false, message: 'username, password, role and full_name are required.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, role, full_name, email, phone, student_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hash, role, full_name, email || null, phone || null, student_id || null]
    );

    await logAudit(req, 'Create', 'Auth', result.insertId, `Admin created new ${role} user: ${username}`);

    res.status(201).json({ success: true, message: 'User created successfully.', id: result.insertId });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/users (admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, role, full_name, email, phone, last_login, created_at FROM users WHERE role IN ("admin", "warden") ORDER BY role, full_name'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/auth/users/:id (admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (String(userId) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }
    
    const [result] = await pool.query('DELETE FROM users WHERE id = ? AND role IN ("admin", "warden")', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found or cannot be deleted.' });
    }
    
    await logAudit(req, 'Delete', 'Auth', userId, `Admin deleted user account ID ${userId}`);
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, verifyOtp, resendOtp, changePassword, forceChangePassword, forgotPassword, resetPassword, getMe, createUser, getAllUsers, deleteUser };
