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
const VideoProgress = require('./models/VideoProgress');

async function runPhase4Tests() {
  try {
    console.log('--- STARTING PHASE 4 LEARNING PROGRESS & DASHBOARD VERIFICATION ---');
    await connectDB();
    await seedAdmin();
    await seedInitialExams();

    // Start Express server instance for testing
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

    // Register test student
    const studentEmail = `p4_student_${Date.now()}@test.com`;
    const studentRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase4 Student',
        email: studentEmail,
        password: 'Password@123',
        selectedExams: ['TNPSC']
      })
    });
    const studentData = await studentRes.json();
    const studentToken = studentData.token;

    // Create test hierarchy and video
    const exam = await Exam.findOne({ isActive: true });
    const subject = await Subject.create({ exam: exam._id, name: 'Phase 4 Test Subject' });
    const topic = await Topic.create({ subject: subject._id, name: 'Phase 4 Test Topic' });
    const video = await Video.create({
      title: 'Phase 4 Progress Test Video',
      exam: exam._id,
      subject: subject._id,
      topic: topic._id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
      cloudinaryPublicId: `demo/p4_sample_${Date.now()}`,
      duration: 100, // 100 seconds duration
      isPublished: true
    });

    // TEST 1: Initial Progress Query (Expect 0 seconds, not completed)
    const initialRes = await fetch(`http://localhost:5000/api/progress/video/${video._id}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const initialJson = await initialRes.json();
    if (initialJson.watchedSeconds !== 0 || initialJson.completed !== false) {
      throw new Error('Initial progress test failed');
    }
    console.log('✓ TEST 1 PASSED: Initial progress correctly defaults to 0 watched seconds & false completed.');

    // TEST 2: Update Progress below 90% threshold (e.g. 45s out of 100s)
    const updateRes1 = await fetch(`http://localhost:5000/api/progress/video/${video._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ watchedSeconds: 45, duration: 100 })
    });
    const updateJson1 = await updateRes1.json();
    if (updateJson1.watchedSeconds !== 45 || updateJson1.completed !== false) {
      throw new Error('Progress update at 45% failed');
    }
    console.log('✓ TEST 2 PASSED: Progress updated to 45s (In-Progress, completed: false).');

    // TEST 3: Auto 90% Completion Rule Verification (e.g. 91s out of 100s)
    const updateRes2 = await fetch(`http://localhost:5000/api/progress/video/${video._id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ watchedSeconds: 91, duration: 100 })
    });
    const updateJson2 = await updateRes2.json();
    if (!updateJson2.completed) {
      throw new Error('Auto 90% completion rule failed!');
    }
    console.log('✓ TEST 3 PASSED: Auto 90% completion rule triggered! (91s / 100s -> completed: true).');

    // TEST 4: Verify Unique Compound Index ({ user: 1, video: 1 })
    const records = await VideoProgress.find({ user: studentData._id, video: video._id });
    if (records.length !== 1) {
      throw new Error('Duplicate VideoProgress records found in database!');
    }
    console.log('✓ TEST 4 PASSED: Unique compound index verified (Exactly 1 record per user+video).');

    // TEST 5: Student Summary Calculation Test
    const summaryRes = await fetch('http://localhost:5000/api/progress/summary', {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const summaryJson = await summaryRes.json();
    if (summaryJson.completedVideos < 1 || summaryJson.overallPercentage < 1) {
      throw new Error('Summary statistics calculation test failed: ' + JSON.stringify(summaryJson));
    }
    console.log('✓ TEST 5 PASSED: Summary endpoint calculated overall progress % and completed counts:', summaryJson);

    // TEST 6: Recently Completed Endpoint Test
    const recentRes = await fetch('http://localhost:5000/api/progress/recently-completed', {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const recentJson = await recentRes.json();
    if (recentJson.length === 0 || recentJson[0].video._id !== video._id.toString()) {
      throw new Error('Recently completed video query failed');
    }
    console.log('✓ TEST 6 PASSED: Recently completed video listed cleanly with video metadata.');

    // Cleanup test records & close server
    await VideoProgress.deleteMany({ video: video._id });
    await Video.findByIdAndDelete(video._id);
    await Topic.findByIdAndDelete(topic._id);
    await Subject.findByIdAndDelete(subject._id);
    server.close();

    console.log('--- ALL PHASE 4 BACKEND & PROGRESS LOGIC TESTS PASSED PERFECTLY ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ PHASE 4 TEST FAILED:', err);
    process.exit(1);
  }
}

runPhase4Tests();
