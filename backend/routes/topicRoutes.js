const express = require('express');
const router = express.Router();
const {
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic
} = require('../controllers/topicController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(getTopics)
  .post(protect, adminOnly, createTopic);

router.route('/:id')
  .get(getTopicById)
  .put(protect, adminOnly, updateTopic)
  .delete(protect, adminOnly, deleteTopic);

module.exports = router;
