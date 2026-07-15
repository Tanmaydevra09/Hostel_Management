const express = require('express');
const router = express.Router();
const c = require('../controllers/leave.controller');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, c.getAll);
router.post('/', auth, c.create);
router.put('/:id/review', auth, authorize('admin', 'warden'), c.review);
router.delete('/:id', auth, authorize('admin'), c.deleteLeave);

module.exports = router;
