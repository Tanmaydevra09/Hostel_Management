const express = require('express');
const router = express.Router();
const c = require('../controllers/students.controller');
const { auth, authorize } = require('../middleware/auth');

router.get('/meta/filters', auth, c.getFilterOptions);
router.get('/', auth, c.getAllStudents);
router.get('/:id', auth, c.getStudentById);
router.post('/', auth, authorize('admin', 'warden'), c.createStudent);
router.put('/:id', auth, authorize('admin', 'warden'), c.updateStudent);
router.delete('/:id', auth, authorize('admin'), c.deleteStudent);
router.post('/:id/photo', auth, authorize('admin', 'warden'), c.uploadPhoto);

module.exports = router;
