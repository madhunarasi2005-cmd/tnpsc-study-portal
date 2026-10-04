const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Exam = require('../models/Exam');

// @desc    Get subjects (optionally filtered by examId query param)
// @route   GET /api/subjects
// @access  Public / Private
const getSubjects = async (req, res) => {
  try {
    const { examId } = req.query;
    const isAdmin = req.user && req.user.role === 'admin';

    const filter = {};
    if (examId && mongoose.Types.ObjectId.isValid(examId)) {
      filter.exam = examId;
    }
    if (!isAdmin && req.query.all !== 'true') {
      filter.isActive = true;
    }

    const subjects = await Subject.find(filter)
      .populate('exam', 'name nameTa code')
      .sort({ order: 1, createdAt: 1 });

    // Attach count of topics under each subject
    const subjectsWithCounts = await Promise.all(
      subjects.map(async (subj) => {
        const topicCount = await Topic.countDocuments({
          subject: subj._id,
          ...(isAdmin ? {} : { isActive: true })
        });
        return {
          ...subj.toObject(),
          topicCount
        };
      })
    );

    return res.json(subjectsWithCounts);
  } catch (error) {
    console.error('getSubjects Error:', error);
    return res.status(500).json({ message: 'Server error fetching subjects', error: error.message });
  }
};

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
// @access  Public
const getSubjectById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const subject = await Subject.findById(req.params.id).populate('exam', 'name nameTa code');
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    return res.json(subject);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching subject', error: error.message });
  }
};

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = async (req, res) => {
  try {
    const { examId, name, nameTa, description, descriptionTa, order, isActive } = req.body;

    if (!examId || !name) {
      return res.status(400).json({ message: 'Exam ID and subject name are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: 'Invalid Exam ID' });
    }

    const examExists = await Exam.findById(examId);
    if (!examExists) {
      return res.status(404).json({ message: 'Target exam not found' });
    }

    const subject = await Subject.create({
      exam: examId,
      name,
      nameTa: nameTa || '',
      description: description || '',
      descriptionTa: descriptionTa || '',
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive : true
    });

    const populatedSubject = await Subject.findById(subject._id).populate('exam', 'name nameTa code');
    return res.status(201).json(populatedSubject);
  } catch (error) {
    console.error('createSubject Error:', error);
    return res.status(500).json({ message: 'Server error creating subject', error: error.message });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const { examId, name, nameTa, description, descriptionTa, order, isActive } = req.body;

    if (examId && examId !== subject.exam.toString()) {
      if (!mongoose.Types.ObjectId.isValid(examId)) {
        return res.status(400).json({ message: 'Invalid Exam ID' });
      }
      const examExists = await Exam.findById(examId);
      if (!examExists) {
        return res.status(404).json({ message: 'Target exam not found' });
      }
      subject.exam = examId;
    }

    if (name !== undefined) subject.name = name;
    if (nameTa !== undefined) subject.nameTa = nameTa;
    if (description !== undefined) subject.description = description;
    if (descriptionTa !== undefined) subject.descriptionTa = descriptionTa;
    if (order !== undefined) subject.order = Number(order);
    if (isActive !== undefined) subject.isActive = isActive;

    const updatedSubject = await subject.save();
    const populated = await Subject.findById(updatedSubject._id).populate('exam', 'name nameTa code');
    return res.json(populated);
  } catch (error) {
    console.error('updateSubject Error:', error);
    return res.status(500).json({ message: 'Server error updating subject', error: error.message });
  }
};

// @desc    Delete subject & cascade delete linked topics
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Cascade delete topics under this subject
    const deletedTopicsResult = await Topic.deleteMany({ subject: subject._id });

    // Delete subject
    await subject.deleteOne();

    return res.json({
      message: 'Subject and associated topics deleted successfully',
      deletedSubjectId: req.params.id,
      deletedTopicsCount: deletedTopicsResult.deletedCount
    });
  } catch (error) {
    console.error('deleteSubject Error:', error);
    return res.status(500).json({ message: 'Server error deleting subject', error: error.message });
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};
