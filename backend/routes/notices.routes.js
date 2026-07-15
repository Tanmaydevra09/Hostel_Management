const express = require('express');
const router = express.Router();
const c = require('../controllers/notices.controller');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, c.getAll);
router.post('/', auth, authorize('admin', 'warden'), c.create);
router.put('/:id', auth, authorize('admin', 'warden'), c.update);
router.delete('/:id', auth, authorize('admin', 'warden'), c.deleteNotice);

module.exports = router;
