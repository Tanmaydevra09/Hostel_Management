const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { 
  getDashboard, getFees, getComplaints, createComplaint, getLeaves, createLeave, updateProfile 
} = require('../controllers/student-portal.controller');

// All routes require student role
router.use(auth, authorize('student'));

router.get('/dashboard', getDashboard);
router.get('/fees', getFees);
router.get('/complaints', getComplaints);
router.post('/complaints', createComplaint);
router.get('/leaves', getLeaves);
router.post('/leaves', createLeave);
router.put('/profile', updateProfile);

module.exports = router;
