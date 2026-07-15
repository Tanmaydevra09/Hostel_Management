const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { auth, authorize } = require('../middleware/auth');

// Strict Admin-only access for all audit routes
router.use(auth, authorize('admin'));

router.get('/', auditController.getLogs);
router.get('/filters', auditController.getFilterOptions);

module.exports = router;
