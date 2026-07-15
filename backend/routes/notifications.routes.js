const express = require('express');
const router = express.Router();
const c = require('../controllers/notifications.controller');
const { auth } = require('../middleware/auth');

router.get('/', auth, c.getMyNotifications);
router.put('/read-all', auth, c.markAllRead);
router.delete('/clear-all', auth, c.clearAll);
router.put('/:id/read', auth, c.markRead);

module.exports = router;
