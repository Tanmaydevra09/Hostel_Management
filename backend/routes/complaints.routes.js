const express = require('express');
const router = express.Router();
const c = require('../controllers/complaints.controller');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, c.getAll);
router.post('/', auth, c.create);
router.put('/:id', auth, authorize('admin', 'warden'), c.updateStatus);
router.delete('/:id', auth, authorize('admin'), c.deleteComplaint);

module.exports = router;
