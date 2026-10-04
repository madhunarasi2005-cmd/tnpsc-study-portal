const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const examRoutes = require('./routes/examRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const topicRoutes = require('./routes/topicRoutes');
const videoRoutes = require('./routes/videoRoutes');
const progressRoutes = require('./routes/progressRoutes');

const User = require('./models/User');
const Exam = require('./models/Exam');
const Subject = require('./models/Subject');
const Topic = require('./models/Topic');
const Video = require('./models/Video');
const VideoProgress = require('./models/VideoProgress');

const { seedAdmin } = require('./controllers/authController');
const { seedInitialExams } = require('./controllers/examController');

async function runPhase7E2EVerification() {
  console.log('================================================================');
  console.log('🚀 STARTING PHASE 7 COMPREHENSIVE END-TO-END VERIFICATION SUITE');
  console.log('================================================================');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tnpsc_study_portal');
    console.log('MongoDB Connected: localhost/tnpsc_study_portal');

    await seedAdmin();
    await seedInitialExams();

    // Start local Express server instance
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

    const TEST_PORT = process.env.TEST_PORT || 5055;
    const server = app.listen(TEST_PORT);

    // ===================================================================
    // 1. AUTHENTICATION & SECURITY VERIFICATION
    // ===================================================================
    console.log('\n[1/5] Testing Authentication & Security Roles...');

    // Admin Login
    const adminLoginRes = await fetch(`http://localhost:${TEST_PORT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;
    if (!adminToken || adminData.role !== 'admin') throw new Error('Admin login failed: ' + JSON.stringify(adminData));
    console.log('  ✓ Admin authentication successful with JWT generation.');

    // Student Registration
    const studentEmail = `final_student_${Date.now()}@test.com`;
    const studentRegRes = await fetch(`http://localhost:${TEST_PORT}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Final Student',
        email: studentEmail,
        password: 'Password@1234',
        selectedExams: ['TNPSC', 'SET']
      })
    });
    const studentData = await studentRegRes.json();
    const studentToken = studentData.token;
    if (!studentToken || studentData.role !== 'student') throw new Error('Student registration failed: ' + JSON.stringify(studentData));
    console.log('  ✓ Student registration successful with multi-exam selection [TNPSC, SET].');

    // Admin Route Protection Check
    const adminTestRes = await fetch(`http://localhost:${TEST_PORT}/api/admin/test`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (adminTestRes.status !== 200) throw new Error('Admin test endpoint failed for admin');

    const studentAdminTestRes = await fetch(`http://localhost:${TEST_PORT}/api/admin/test`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    if (studentAdminTestRes.status !== 403) throw new Error('Student accessed admin test endpoint!');
    console.log('  ✓ Admin route protection verified (Admin: 200 OK, Student: 403 Forbidden).');

    // ===================================================================
    // 2. ERROR HANDLING & INVALID OBJECTID GUARDS
    // ===================================================================
    console.log('\n[2/5] Testing Error Handling & Invalid ObjectID Guards...');

    const invalidExamRes = await fetch(`http://localhost:${TEST_PORT}/api/exams/invalid_id_format`);
    if (invalidExamRes.status !== 404) throw new Error('Invalid Exam ID did not return 404');

    const invalidVideoRes = await fetch(`http://localhost:${TEST_PORT}/api/videos/invalid_id_format`);
    if (invalidVideoRes.status !== 404) throw new Error('Invalid Video ID did not return 404');

    const invalidProgressRes = await fetch(`http://localhost:${TEST_PORT}/api/progress/video/invalid_id_format`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    if (invalidProgressRes.status !== 404) throw new Error('Invalid Progress Video ID did not return 404');
    console.log('  ✓ All endpoints gracefully handle invalid ObjectIDs returning 404 without crashing.');

    // ===================================================================
    // 3. ADMIN CONTENT MANAGEMENT & VIDEO PUBLISHING
    // ===================================================================
    console.log('\n[3/5] Testing Admin Content Management & Video Publishing...');

    const exam = await Exam.findOne({ isActive: true });
    const subject = await Subject.create({ exam: exam._id, name: 'Final E2E Subject', nameTa: 'இறுதி சோதனை பாடம்' });
    const topic = await Topic.create({ subject: subject._id, name: 'Final E2E Topic', nameTa: 'இறுதி சோதனை தலைப்பு' });

    // Create Published Video
    const video = await Video.create({
      title: 'Modern Indian History & Freedom Struggle',
      titleTa: 'நவீன இந்திய வரலாறு மற்றும் விடுதலைப் போராட்டம்',
      description: 'Analysis of major events leading up to Indian Independence in 1947',
      descriptionTa: '1947 இந்திய விடுதலைக்கான முக்கிய நிகழ்வுகளின் தொகுப்பு',
      exam: exam._id,
      subject: subject._id,
      topic: topic._id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample_e2e.mp4',
      cloudinaryPublicId: `e2e_pub_${Date.now()}`,
      duration: 120, // 120 seconds
      isPublished: true
    });

    // Create Draft Video
    const draftVideo = await Video.create({
      title: 'Draft Unreleased Lecture',
      description: 'Work in progress lecture',
      exam: exam._id,
      subject: subject._id,
      topic: topic._id,
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/sample_draft.mp4',
      cloudinaryPublicId: `e2e_draft_${Date.now()}`,
      duration: 80,
      isPublished: false
    });

    // Verify Student cannot access draft video
    const studentDraftCheck = await fetch(`http://localhost:${TEST_PORT}/api/videos/${draftVideo._id}`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    if (studentDraftCheck.status !== 404) throw new Error('Student was able to access unpublished draft video!');

    // Verify Admin can access draft video
    const adminDraftCheck = await fetch(`http://localhost:${TEST_PORT}/api/videos/${draftVideo._id}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (adminDraftCheck.status !== 200) throw new Error('Admin failed to access draft video!');
    console.log('  ✓ Publishing scoping verified: Students strictly blocked from draft videos.');

    // ===================================================================
    // 4. SEARCH, FILTERING & BILINGUAL MATCHING
    // ===================================================================
    console.log('\n[4/5] Testing Search, Filtering & Bilingual Fallbacks...');

    // Search by English Keyword
    const searchEnRes = await fetch(`http://localhost:${TEST_PORT}/api/videos?search=Freedom`);
    const searchEn = await searchEnRes.json();
    if (searchEn.length === 0 || searchEn[0]._id !== video._id.toString()) throw new Error('English search failed');

    // Search by Tamil Keyword
    const searchTaRes = await fetch(`http://localhost:${TEST_PORT}/api/videos?search=${encodeURIComponent('விடுதலை')}`);
    const searchTa = await searchTaRes.json();
    if (searchTa.length === 0 || searchTa[0]._id !== video._id.toString()) throw new Error('Tamil search failed');
    console.log('  ✓ Search & Filtering verified across English and Tamil keyword queries.');

    // ===================================================================
    // 5. PROGRESS TRACKING, RESUME & 90% COMPLETION
    // ===================================================================
    console.log('\n[5/5] Testing Progress Tracking, Resume, 90% Completion & Analytics...');

    // Progress at 50s / 120s (41% -> in-progress)
    await fetch(`http://localhost:${TEST_PORT}/api/progress/video/${video._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ watchedSeconds: 50, duration: 120 })
    });

    const contRes = await fetch(`http://localhost:${TEST_PORT}/api/progress/continue-watching`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const contData = await contRes.json();
    if (contData.length === 0 || contData[0].watchedSeconds !== 50) throw new Error('Continue watching tracking failed');
    console.log('  ✓ Partial progress saved (50s) and listed in Continue Watching.');

    // Progress at 110s / 120s (91.6% -> triggers auto 90% complete)
    const compRes = await fetch(`http://localhost:${TEST_PORT}/api/progress/video/${video._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ watchedSeconds: 110, duration: 120 })
    });
    const compData = await compRes.json();
    if (!compData.completed) throw new Error('90% Auto completion failed!');
    console.log('  ✓ Auto 90% completion rule triggered successfully (110s/120s -> completed: true).');

    // Admin Analytics Check
    const analyticsRes = await fetch(`http://localhost:${TEST_PORT}/api/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const analyticsData = await analyticsRes.json();
    if (analyticsRes.status !== 200 || typeof analyticsData.totalStudents !== 'number') {
      throw new Error('Admin analytics calculation failed');
    }
    console.log('  ✓ Admin Analytics computed system-wide counters and student completions.');

    // Cleanup test records
    await VideoProgress.deleteMany({ video: { $in: [video._id, draftVideo._id] } });
    await Video.deleteMany({ _id: { $in: [video._id, draftVideo._id] } });
    await Topic.findByIdAndDelete(topic._id);
    await Subject.findByIdAndDelete(subject._id);
    server.close();

    console.log('\n================================================================');
    console.log('🎉 ALL PHASE 7 END-TO-END INTEGRATION & SECURITY TESTS PASSED!');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PHASE 7 TEST FAILED:', err);
    process.exit(1);
  }
}

runPhase7E2EVerification();
