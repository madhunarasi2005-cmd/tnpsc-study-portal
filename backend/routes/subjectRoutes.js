const express = require('express');
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/subjectController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(getSubjects)
  .post(protect, adminOnly, createSubject);

router.route('/:id')
  .get(getSubjectById)
  .put(protect, adminOnly, updateSubject)
  .delete(protect, adminOnly, deleteSubject);

module.exports = router;
