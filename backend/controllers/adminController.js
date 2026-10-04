const User = require('../models/User');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Video = require('../models/Video');
const Material = require('../models/Material');
const VideoProgress = require('../models/VideoProgress');

// @desc    Get comprehensive system analytics for admin dashboard
// @route   GET /api/admin/analytics
// @access  Private/Admin Only
const getAnalytics = async (req, res) => {
  try {
    const [
      totalStudents,
      totalExams,
      totalSubjects,
      totalTopics,
      totalVideos,
      publishedVideos,
      unpublishedVideos,
      totalMaterials,
      totalProgressRecords,
      totalCompletedProgress
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Exam.countDocuments(),
      Subject.countDocuments(),
      Topic.countDocuments(),
      Video.countDocuments(),
      Video.countDocuments({ isPublished: true }),
      Video.countDocuments({ isPublished: false }),
      Material.countDocuments(),
      VideoProgress.countDocuments(),
      VideoProgress.countDocuments({ completed: true })
    ]);

    // Most completed videos aggregation
    const mostCompletedAggregation = await VideoProgress.aggregate([
      { $match: { completed: true } },
      { $group: { _id: '$video', completionCount: { $sum: 1 } } },
      { $sort: { completionCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'videos',
          localField: '_id',
          foreignField: '_id',
          as: 'videoDetails'
        }
      },
      { $unwind: '$videoDetails' },
      {
        $lookup: {
          from: 'exams',
          localField: 'videoDetails.exam',
          foreignField: '_id',
          as: 'examDetails'
        }
      },
      { $unwind: { path: '$examDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'subjects',
          localField: 'videoDetails.subject',
          foreignField: '_id',
          as: 'subjectDetails'
        }
      },
      { $unwind: { path: '$subjectDetails', preserveNullAndEmptyArrays: true } }
    ]);

    const mostCompletedVideos = mostCompletedAggregation.map(item => ({
      videoId: item._id,
      title: item.videoDetails.title,
      titleTa: item.videoDetails.titleTa,
      examCode: item.examDetails?.code || 'EXAM',
      subjectName: item.subjectDetails?.name || 'Subject',
      subjectNameTa: item.subjectDetails?.nameTa || '',
      completionCount: item.completionCount
    }));

    // Exam-wise statistics
    const allExams = await Exam.find().sort({ createdAt: 1 });
    const examWiseStats = await Promise.all(
      allExams.map(async (exam) => {
        const subjectCount = await Subject.countDocuments({ exam: exam._id });
        const videos = await Video.find({ exam: exam._id });
        const materialsCount = await Material.countDocuments({ exam: exam._id });
        const videoCount = videos.length;
        const videoIds = videos.map(v => v._id);
        const completedCount = videoIds.length > 0
          ? await VideoProgress.countDocuments({ video: { $in: videoIds }, completed: true })
          : 0;

        return {
          examId: exam._id,
          code: exam.code,
          name: exam.name,
          nameTa: exam.nameTa,
          isActive: exam.isActive,
          subjectCount,
          videoCount,
          materialsCount,
          completedCount
        };
      })
    );

    const overallCompletionRate = totalProgressRecords > 0
      ? Math.round((totalCompletedProgress / totalProgressRecords) * 100)
      : 0;

    return res.json({
      totalStudents,
      totalExams,
      totalSubjects,
      totalTopics,
      totalVideos,
      publishedVideos,
      unpublishedVideos,
      totalMaterials,
      learningProgress: {
        totalProgressRecords,
        totalCompletedProgress,
        overallCompletionRate
      },
      mostCompletedVideos,
      examWiseStats
    });
  } catch (error) {
    console.error('getAnalytics Error:', error);
    return res.status(500).json({ message: 'Server error fetching analytics', error: error.message });
  }
};

module.exports = {
  getAnalytics
};
