const express = require('express');
const router = express.Router();
const c = require('../controllers/reports.controller');
const { auth, authorize } = require('../middleware/auth');

router.get('/students', auth, authorize('admin', 'warden'), c.studentsReport);
router.get('/fees', auth, authorize('admin', 'warden'), c.feesReport);
router.get('/occupancy', auth, authorize('admin', 'warden'), c.occupancyReport);

module.exports = router;
