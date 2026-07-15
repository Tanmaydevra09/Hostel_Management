const express = require('express');
const router = express.Router();
const c = require('../controllers/attendance.controller');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, c.getAttendance);
router.get('/report', auth, authorize('admin', 'warden'), c.getReport);
router.post('/mark', auth, authorize('admin', 'warden'), c.markAttendance);

module.exports = router;
