const express = require('express');
const router = express.Router();
const c = require('../controllers/fees.controller');
const { auth, authorize } = require('../middleware/auth');

router.get('/report/monthly', auth, authorize('admin', 'warden'), c.getMonthlyReport);
router.get('/', auth, c.getAllFees);
router.get('/:id', auth, c.getFeeById);
router.get('/:id/receipt', auth, c.downloadReceipt);
router.post('/', auth, authorize('admin', 'warden'), c.createFee);
router.put('/:id/pay', auth, authorize('admin', 'warden'), c.markAsPaid);
router.put('/:id', auth, authorize('admin', 'warden'), c.updateFee);
router.delete('/:id', auth, authorize('admin'), c.deleteFee);

module.exports = router;
