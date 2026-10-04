const express = require('express');
const router = express.Router();
const {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam
} = require('../controllers/examController');
const { protect, optionalAuth, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(optionalAuth, getExams)
  .post(protect, adminOnly, createExam);

router.route('/:id')
  .get(optionalAuth, getExamById)
  .put(protect, adminOnly, updateExam)
  .delete(protect, adminOnly, deleteExam);

module.exports = router;
