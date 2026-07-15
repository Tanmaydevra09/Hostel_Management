const express = require('express');
const router = express.Router();
const c = require('../controllers/rooms.controller');
const { auth, authorize } = require('../middleware/auth');

router.get('/meta/blocks', auth, c.getBlocks);
router.get('/', auth, c.getAllRooms);
router.get('/:id', auth, c.getRoomById);
router.post('/auto-allocate', auth, authorize('admin', 'warden'), c.autoAllocate);
router.post('/', auth, authorize('admin', 'warden'), c.createRoom);
router.put('/:id', auth, authorize('admin', 'warden'), c.updateRoom);
router.delete('/:id', auth, authorize('admin'), c.deleteRoom);

module.exports = router;
