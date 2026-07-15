const express = require('express');
const router = express.Router();
const c = require('../controllers/visitors.controller');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, authorize('admin', 'warden'), c.getAll);
router.post('/', auth, authorize('admin', 'warden'), c.create);
router.put('/:id/checkout', auth, authorize('admin', 'warden'), c.checkout);

module.exports = router;
