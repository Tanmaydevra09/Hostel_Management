const express = require('express');
const router = express.Router();
const { getStats, getRecentActivity, getMonthlyRevenue, getWardenStats } = require('../controllers/dashboard.controller');
const { auth } = require('../middleware/auth');

router.get('/stats', auth, getStats);
router.get('/recent-activity', auth, getRecentActivity);
router.get('/monthly-revenue', auth, getMonthlyRevenue);
router.get('/warden-stats', auth, getWardenStats);

module.exports = router;
