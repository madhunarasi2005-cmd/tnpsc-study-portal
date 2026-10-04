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

async function runPhase6Tests() {
  try {
    console.log('--- STARTING PHASE 6 ADMIN DASHBOARD & ANALYTICS VERIFICATION ---');
    await connectDB();
    await seedAdmin();
    await seedInitialExams();

    // Start Express app for testing
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

    // 1. Login Admin
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

    // 2. Register Student
    const studentRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase6 Student',
        email: `p6_student_${Date.now()}@test.com`,
        password: 'Password@123',
        selectedExams: ['TNPSC']
      })
    });
    const studentData = await studentRes.json();
    const studentToken = studentData.token;

    // TEST 1: Student Attempt to Access Analytics (Expect 403 Forbidden)
    const studentAnalyticsRes = await fetch('http://localhost:5000/api/admin/analytics', {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    if (studentAnalyticsRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for student analytics access, got ${studentAnalyticsRes.status}`);
    }
    console.log('✓ TEST 1 PASSED: Student access to /api/admin/analytics rejected with 403 Forbidden.');

    // TEST 2: Unauthenticated Attempt (Expect 401 Unauthorized)
    const unauthAnalyticsRes = await fetch('http://localhost:5000/api/admin/analytics');
    if (unauthAnalyticsRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized for unauthenticated analytics access, got ${unauthAnalyticsRes.status}`);
    }
    console.log('✓ TEST 2 PASSED: Unauthenticated access rejected with 401 Unauthorized.');

    // TEST 3: Admin Analytics Access (Expect 200 OK & valid stats structure)
    const adminAnalyticsRes = await fetch('http://localhost:5000/api/admin/analytics', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const analytics = await adminAnalyticsRes.json();
    if (adminAnalyticsRes.status !== 200) {
      throw new Error('Admin analytics fetch failed: ' + JSON.stringify(analytics));
    }

    if (
      typeof analytics.totalStudents !== 'number' ||
      typeof analytics.totalExams !== 'number' ||
      typeof analytics.totalSubjects !== 'number' ||
      typeof analytics.totalTopics !== 'number' ||
      typeof analytics.totalVideos !== 'number' ||
      typeof analytics.publishedVideos !== 'number' ||
      typeof analytics.unpublishedVideos !== 'number' ||
      !Array.isArray(analytics.examWiseStats) ||
      !Array.isArray(analytics.mostCompletedVideos)
    ) {
      throw new Error('Analytics response payload structure is missing required fields');
    }
    console.log('✓ TEST 3 PASSED: Admin analytics query returned full 200 OK statistics payload:', {
      totalStudents: analytics.totalStudents,
      totalExams: analytics.totalExams,
      totalSubjects: analytics.totalSubjects,
      totalVideos: analytics.totalVideos,
      publishedVideos: analytics.publishedVideos,
      examsTracked: analytics.examWiseStats.length
    });

    // TEST 4: Exam-wise Data Structure Verification
    if (analytics.examWiseStats.length > 0) {
      const examStat = analytics.examWiseStats[0];
      if (!examStat.code || typeof examStat.subjectCount !== 'number' || typeof examStat.videoCount !== 'number') {
        throw new Error('Exam-wise stats item missing required properties');
      }
    }
    console.log('✓ TEST 4 PASSED: Exam-wise data breakdown verified cleanly.');

    server.close();
    console.log('--- ALL PHASE 6 BACKEND & ANALYTICS TESTS PASSED PERFECTLY ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ PHASE 6 TEST FAILED:', err);
    process.exit(1);
  }
}

runPhase6Tests();
