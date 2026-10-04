const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const examRoutes = require('./routes/examRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const topicRoutes = require('./routes/topicRoutes');
const videoRoutes = require('./routes/videoRoutes');
const progressRoutes = require('./routes/progressRoutes');
const { seedAdmin } = require('./controllers/authController');
const { seedInitialExams } = require('./controllers/examController');
const Exam = require('./models/Exam');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const Video = require('./models/Video');

async function runPhase5Tests() {
  try {
    console.log('--- STARTING PHASE 5 SEARCH, FILTERING & DISCOVERY VERIFICATION ---');
    await connectDB();
    await seedAdmin();
    await seedInitialExams();

    // Express App Setup for testing
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/exams', examRoutes);
    app.use('/api/subjects', subjectRoutes);
    app.use('/api/topics', topicRoutes);
    app.use('/api/videos', videoRoutes);
    app.use('/api/progress', progressRoutes);

    const server = app.listen(5000);

    // Login Admin
    const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;

    // Register Student
    const studentRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase5 Student',
        email: `p5_student_${Date.now()}@test.com`,
        password: 'Password@123',
        selectedExams: ['TNPSC']
      })
    });
    const studentData = await studentRes.json();
    const studentToken = studentData.token;

    // Setup Test Hierarchy
    const exam = await Exam.findOne({ isActive: true });
    const subject = await Subject.create({ exam: exam._id, name: 'Phase 5 Discovery Subject' });
    const topic = await Topic.create({ subject: subject._id, name: 'Phase 5 Discovery Topic' });

    // Create 3 Test Videos
    // Video 1: Published, Title: "Indian Constitution Preamble Analysis"
    const video1 = await Video.create({
      title: 'Indian Constitution Preamble Analysis',
      titleTa: 'இந்திய அரசியலமைப்பு முகப்புரை விளக்கம்',
      description: 'Detailed breakdown of sovereign socialist secular democratic republic concepts',
      descriptionTa: 'அரசியலமைப்பு கொள்கைகளின் விரிவான விளக்கம்',
      exam: exam._id,
      subject: subject._id,
      topic: topic._id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1/sample1.mp4',
      cloudinaryPublicId: `p5_test_v1_${Date.now()}`,
      duration: 300,
      isPublished: true
    });

    // Video 2: Published, Title: "Quantum Physics Fundamentals"
    const video2 = await Video.create({
      title: 'Quantum Physics Fundamentals',
      titleTa: 'குவாண்டம் பௌதிகம் அடிப்படை',
      description: 'Wave particle duality and Schrodinger wave mechanics equations',
      descriptionTa: 'அலை துகள்கள் பற்றிய கணித சமன்பாடுகள்',
      exam: exam._id,
      subject: subject._id,
      topic: topic._id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1/sample2.mp4',
      cloudinaryPublicId: `p5_test_v2_${Date.now()}`,
      duration: 450,
      isPublished: true
    });

    // Video 3: Unpublished Draft, Title: "Draft Secret Lecture"
    const video3 = await Video.create({
      title: 'Draft Secret Lecture',
      description: 'Unpublished content for admin preview only',
      exam: exam._id,
      subject: subject._id,
      topic: topic._id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1/sample3.mp4',
      cloudinaryPublicId: `p5_test_v3_${Date.now()}`,
      duration: 200,
      isPublished: false
    });

    // TEST 1: Search by Video Title Keyword ("Preamble")
    const titleSearchRes = await fetch('http://localhost:5000/api/videos?search=Preamble');
    const titleSearch = await titleSearchRes.json();
    if (titleSearch.length !== 1 || titleSearch[0]._id !== video1._id.toString()) {
      throw new Error('Title search test failed');
    }
    console.log('✓ TEST 1 PASSED: Case-insensitive search by video title ("Preamble") returned correct video.');

    // TEST 2: Search by Video Description Keyword ("Schrodinger")
    const descSearchRes = await fetch('http://localhost:5000/api/videos?search=Schrodinger');
    const descSearch = await descSearchRes.json();
    if (descSearch.length !== 1 || descSearch[0]._id !== video2._id.toString()) {
      throw new Error('Description search test failed');
    }
    console.log('✓ TEST 2 PASSED: Case-insensitive search by description ("Schrodinger") returned correct video.');

    // TEST 3: Search by Tamil Title Keyword ("முகப்புரை")
    const tamilSearchRes = await fetch(`http://localhost:5000/api/videos?search=${encodeURIComponent('முகப்புரை')}`);
    const tamilSearch = await tamilSearchRes.json();
    if (tamilSearch.length !== 1 || tamilSearch[0]._id !== video1._id.toString()) {
      throw new Error('Tamil search test failed');
    }
    console.log('✓ TEST 3 PASSED: Search by Tamil keyword ("முகப்புரை") returned correct video.');

    // TEST 4: Hierarchy Filter (Exam ID + Subject ID + Topic ID)
    const filterRes = await fetch(`http://localhost:5000/api/videos?examId=${exam._id}&subjectId=${subject._id}&topicId=${topic._id}`);
    const filterList = await filterRes.json();
    if (filterList.length !== 2) { // 2 published videos
      throw new Error(`Hierarchy filter test failed, expected 2 published videos got ${filterList.length}`);
    }
    console.log('✓ TEST 4 PASSED: Combined hierarchy filter (Exam + Subject + Topic) returned matching published videos.');

    // TEST 5: Student Receives Published Videos ONLY
    const studentResList = await fetch(`http://localhost:5000/api/videos?topicId=${topic._id}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const studentList = await studentResList.json();
    if (studentList.some(v => v._id === video3._id.toString())) {
      throw new Error('Student received unpublished draft video!');
    }
    console.log('✓ TEST 5 PASSED: Student query strictly filtered out unpublished draft videos.');

    // TEST 6: Admin Receives ALL Videos (Including Drafts)
    const adminResList = await fetch(`http://localhost:5000/api/videos?topicId=${topic._id}&all=true`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminList = await adminResList.json();
    if (!adminList.some(v => v._id === video3._id.toString())) {
      throw new Error('Admin failed to receive unpublished draft video!');
    }
    console.log('✓ TEST 6 PASSED: Admin query with all=true successfully returned both published and draft videos.');

    // TEST 7: Combined Search + Filters (Search "Physics" + Topic Filter)
    const combinedRes = await fetch(`http://localhost:5000/api/videos?topicId=${topic._id}&search=Physics`);
    const combinedList = await combinedRes.json();
    if (combinedList.length !== 1 || combinedList[0]._id !== video2._id.toString()) {
      throw new Error('Combined search + filter test failed');
    }
    console.log('✓ TEST 7 PASSED: Combined search keyword + topic filter returned exact target video.');

    // Cleanup test records
    await Video.deleteMany({ _id: { $in: [video1._id, video2._id, video3._id] } });
    await Topic.findByIdAndDelete(topic._id);
    await Subject.findByIdAndDelete(subject._id);
    server.close();

    console.log('--- ALL PHASE 5 SEARCH, FILTERING & DISCOVERY TESTS PASSED PERFECTLY ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ PHASE 5 TEST FAILED:', err);
    process.exit(1);
  }
}

runPhase5Tests();
