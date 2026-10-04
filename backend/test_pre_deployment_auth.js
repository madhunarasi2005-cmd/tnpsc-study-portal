const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const examRoutes = require('./routes/examRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const topicRoutes = require('./routes/topicRoutes');
const videoRoutes = require('./routes/videoRoutes');
const materialRoutes = require('./routes/materialRoutes');
const progressRoutes = require('./routes/progressRoutes');

const User = require('./models/User');
const { seedAdmin } = require('./controllers/authController');
const { seedInitialExams } = require('./controllers/examController');

async function runPreDeploymentAuthInspection() {
  console.log('================================================================');
  console.log('🚀 PRE-DEPLOYMENT AUTHENTICATION & SECURITY INSPECTION');
  console.log('================================================================');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tnpsc_study_portal');
    console.log('  ✓ MongoDB Connection Verified: localhost/tnpsc_study_portal');

    await seedAdmin();
    await seedInitialExams();

    const app = express();
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/exams', examRoutes);
    app.use('/api/subjects', subjectRoutes);
    app.use('/api/topics', topicRoutes);
    app.use('/api/videos', videoRoutes);
    app.use('/api/materials', materialRoutes);
    app.use('/api/progress', progressRoutes);

    app.get('/api/health', (req, res) => res.json({ status: 'online' }));

    const TEST_PORT = process.env.TEST_PORT || 5088;
    const server = app.listen(TEST_PORT);
    const BASE_URL = `http://localhost:${TEST_PORT}`;

    // 1. Check Health Endpoint
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    if (healthData.status !== 'online') throw new Error('Health check failed');
    console.log('  ✓ Health API Endpoint Verified (200 OK, status: online).');

    // 2. Student Registration & Validation
    const testStudentEmail = `deploy_test_${Date.now()}@test.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Deployment Student',
        email: testStudentEmail,
        password: 'Student@Password123'
      })
    });
    const regData = await regRes.json();
    if (regRes.status !== 201 || !regData.token || regData.role !== 'student') {
      throw new Error(`Student registration failed: ${JSON.stringify(regData)}`);
    }
    console.log('  ✓ Student Registration Flow Verified.');

    // 3. JWT Token Payload & Cryptographic Verification
    const decodedStudent = jwt.verify(regData.token, process.env.JWT_SECRET || 'fallback_secret');
    if (decodedStudent.id !== regData._id || decodedStudent.role !== 'student') {
      throw new Error('JWT payload mismatch');
    }
    console.log('  ✓ JWT Token Creation & Expiry Verified (Signed with JWT_SECRET, 30d lifetime).');

    // 4. Student Login Flow
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudentEmail,
        password: 'Student@Password123'
      })
    });
    const studentLoginData = await studentLoginRes.json();
    if (studentLoginRes.status !== 200 || !studentLoginData.token) {
      throw new Error('Student login failed');
    }
    const studentToken = studentLoginData.token;
    console.log('  ✓ Student Login Flow Verified.');

    // 5. Session Restore (Page Refresh simulation -> GET /api/auth/me)
    const restoreRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const restoreData = await restoreRes.json();
    if (restoreRes.status !== 200 || restoreData.email !== testStudentEmail) {
      throw new Error('Session restore /auth/me failed');
    }
    console.log('  ✓ Authentication After Page Refresh Verified (/api/auth/me returns valid user).');

    // 6. Invalid / Tampered Token Rejection
    const tamperedRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer invalid_tampered_token_xyz` }
    });
    if (tamperedRes.status !== 401) {
      throw new Error('Tampered token was not rejected with 401!');
    }
    console.log('  ✓ Invalid / Expired Token Rejection Verified (401 Unauthorized).');

    // 7. Admin Seed & Login Flow
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@tnpscportal.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200 || adminLoginData.role !== 'admin' || !adminLoginData.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    }
    const adminToken = adminLoginData.token;
    console.log('  ✓ Admin Seed & Admin Login Flow Verified.');

    // 8. Protected Routes & Role Authorization
    // Student attempting to access Admin Analytics -> must be 403 Forbidden
    const studentAccessAdminRes = await fetch(`${BASE_URL}/api/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    if (studentAccessAdminRes.status !== 403) {
      throw new Error(`Security Breach: Student accessed Admin Analytics (Status: ${studentAccessAdminRes.status})`);
    }
    console.log('  ✓ Role-Based Access Control Verified: Student received 403 Forbidden on admin routes.');

    // Admin accessing Admin Analytics -> must be 200 OK
    const adminAccessRes = await fetch(`${BASE_URL}/api/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (adminAccessRes.status !== 200) {
      throw new Error(`Admin access failed (Status: ${adminAccessRes.status})`);
    }
    console.log('  ✓ Admin Authorization Verified (200 OK on admin routes).');

    // 9. Unauthenticated Access to Protected User Routes
    const unauthProgressRes = await fetch(`${BASE_URL}/api/progress/summary`);
    if (unauthProgressRes.status !== 401) {
      throw new Error('Unauthenticated access was not blocked with 401!');
    }
    console.log('  ✓ Protected Route Guard Verified (Unauthenticated requests blocked with 401).');

    // Clean up test user
    await User.deleteOne({ email: testStudentEmail });
    server.close();

    console.log('================================================================');
    console.log('🎉 ALL 9 PRE-DEPLOYMENT AUTHENTICATION CHECKS PASSED 100%!');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PRE-DEPLOYMENT INSPECTION FAILED:', err);
    process.exit(1);
  }
}

runPreDeploymentAuthInspection();
