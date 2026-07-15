const express = require('express');
const router = express.Router();
const { login, verifyOtp, resendOtp, forgotPassword, resetPassword, forceChangePassword, changePassword, getMe, createUser, getAllUsers, deleteUser } = require('../controllers/auth.controller');
const { auth, authorize } = require('../middleware/auth');

router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/force-change-password', forceChangePassword);
router.get('/me', auth, getMe);
router.post('/change-password', auth, changePassword);
router.post('/create-user', auth, authorize('admin'), createUser);
router.get('/users', auth, authorize('admin'), getAllUsers);
router.delete('/users/:id', auth, authorize('admin'), deleteUser);

module.exports = router;
