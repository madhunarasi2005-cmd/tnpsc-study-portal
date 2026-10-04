const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Subject = require('../models/Subject');

// @desc    Get topics (optionally filtered by subjectId query param)
// @route   GET /api/topics
// @access  Public / Private
const getTopics = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const isAdmin = req.user && req.user.role === 'admin';

    const filter = {};
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      filter.subject = subjectId;
    }
    if (!isAdmin && req.query.all !== 'true') {
      filter.isActive = true;
    }

    const topics = await Topic.find(filter)
      .populate({
        path: 'subject',
        select: 'name nameTa exam',
        populate: {
          path: 'exam',
          select: 'name nameTa code'
        }
      })
      .sort({ order: 1, createdAt: 1 });

    return res.json(topics);
  } catch (error) {
    console.error('getTopics Error:', error);
    return res.status(500).json({ message: 'Server error fetching topics', error: error.message });
  }
};

// @desc    Get single topic by ID
// @route   GET /api/topics/:id
// @access  Public
const getTopicById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const topic = await Topic.findById(req.params.id).populate({
      path: 'subject',
      select: 'name nameTa exam',
      populate: {
        path: 'exam',
        select: 'name nameTa code'
      }
    });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    return res.json(topic);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching topic', error: error.message });
  }
};

// @desc    Create a new topic
// @route   POST /api/topics
// @access  Private/Admin
const createTopic = async (req, res) => {
  try {
    const { subjectId, name, nameTa, description, descriptionTa, order, isActive } = req.body;

    if (!subjectId || !name) {
      return res.status(400).json({ message: 'Subject ID and topic name are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: 'Invalid Subject ID' });
    }

    const subjectExists = await Subject.findById(subjectId);
    if (!subjectExists) {
      return res.status(404).json({ message: 'Target subject not found' });
    }

    const topic = await Topic.create({
      subject: subjectId,
      name,
      nameTa: nameTa || '',
      description: description || '',
      descriptionTa: descriptionTa || '',
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive : true
    });

    const populatedTopic = await Topic.findById(topic._id).populate('subject', 'name nameTa');
    return res.status(201).json(populatedTopic);
  } catch (error) {
    console.error('createTopic Error:', error);
    return res.status(500).json({ message: 'Server error creating topic', error: error.message });
  }
};

// @desc    Update topic
// @route   PUT /api/topics/:id
// @access  Private/Admin
const updateTopic = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const { subjectId, name, nameTa, description, descriptionTa, order, isActive } = req.body;

    if (subjectId && subjectId !== topic.subject.toString()) {
      if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ message: 'Invalid Subject ID' });
      }
      const subjectExists = await Subject.findById(subjectId);
      if (!subjectExists) {
        return res.status(404).json({ message: 'Target subject not found' });
      }
      topic.subject = subjectId;
    }

    if (name !== undefined) topic.name = name;
    if (nameTa !== undefined) topic.nameTa = nameTa;
    if (description !== undefined) topic.description = description;
    if (descriptionTa !== undefined) topic.descriptionTa = descriptionTa;
    if (order !== undefined) topic.order = Number(order);
    if (isActive !== undefined) topic.isActive = isActive;

    const updatedTopic = await topic.save();
    const populated = await Topic.findById(updatedTopic._id).populate('subject', 'name nameTa');
    return res.json(populated);
  } catch (error) {
    console.error('updateTopic Error:', error);
    return res.status(500).json({ message: 'Server error updating topic', error: error.message });
  }
};

// @desc    Delete topic
// @route   DELETE /api/topics/:id
// @access  Private/Admin
const deleteTopic = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    await topic.deleteOne();
    return res.json({ message: 'Topic deleted successfully', deletedTopicId: req.params.id });
  } catch (error) {
    console.error('deleteTopic Error:', error);
    return res.status(500).json({ message: 'Server error deleting topic', error: error.message });
  }
};

module.exports = {
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic
};
