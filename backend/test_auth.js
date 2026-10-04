const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');
const { seedAdmin } = require('./controllers/authController');
const jwt = require('jsonwebtoken');

async function runAuthTests() {
  try {
    console.log('--- STARTING AUTH & ADMIN VERIFICATION TESTS ---');
    await connectDB();
    await seedAdmin();

    // 1. Verify Admin Seed
    const admin = await User.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
    if (!admin || admin.role !== 'admin') {
      throw new Error('Admin seed verification failed');
    }
    console.log('✓ TEST 1 PASSED: Admin seeded cleanly with email:', admin.email);

    // 2. Register Student with multi-exams
    const testStudentEmail = `student_${Date.now()}@test.com`;
    const registerRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Aspirant',
        email: testStudentEmail,
        password: 'Student@123456',
        selectedExams: ['TNPSC', 'UGC NET']
      })
    });
    const studentData = await registerRes.json();
    if (registerRes.status !== 201 || !studentData.token) {
      throw new Error('Student registration failed: ' + JSON.stringify(studentData));
    }
    console.log('✓ TEST 2 PASSED: Student registered cleanly with selectedExams:', studentData.selectedExams);

    // 3. Admin Login
    const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      })
    });
    const adminData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200 || adminData.role !== 'admin') {
      throw new Error('Admin login failed: ' + JSON.stringify(adminData));
    }
    console.log('✓ TEST 3 PASSED: Admin login successful, role confirmed as admin.');

    // 4. Test GET /api/admin/test with Admin JWT (Expect 200)
    const adminTestRes = await fetch('http://localhost:5000/api/admin/test', {
      headers: { 'Authorization': `Bearer ${adminData.token}` }
    });
    const adminTestJson = await adminTestRes.json();
    if (adminTestRes.status !== 200) {
      throw new Error('Admin test with Admin JWT failed, status: ' + adminTestRes.status);
    }
    console.log('✓ TEST 4 PASSED: Admin JWT -> GET /api/admin/test returned 200 OK:', adminTestJson.message);

    // 5. Test GET /api/admin/test with Student JWT (Expect 403)
    const studentTestRes = await fetch('http://localhost:5000/api/admin/test', {
      headers: { 'Authorization': `Bearer ${studentData.token}` }
    });
    const studentTestJson = await studentTestRes.json();
    if (studentTestRes.status !== 403) {
      throw new Error('Admin test with Student JWT failed, status was ' + studentTestRes.status + ' instead of 403');
    }
    console.log('✓ TEST 5 PASSED: Student JWT -> GET /api/admin/test returned 403 Forbidden:', studentTestJson.message);

    // 6. Test GET /api/admin/test with No JWT (Expect 401)
    const noTokenRes = await fetch('http://localhost:5000/api/admin/test');
    const noTokenJson = await noTokenRes.json();
    if (noTokenRes.status !== 401) {
      throw new Error('Admin test with No JWT failed, status was ' + noTokenRes.status + ' instead of 401');
    }
    console.log('✓ TEST 6 PASSED: No JWT -> GET /api/admin/test returned 401 Unauthorized:', noTokenJson.message);

    console.log('--- ALL BACKEND AUTH & ROLE TESTS PASSED PERFECTLY ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ AUTH TEST FAILED:', err);
    process.exit(1);
  }
}

runAuthTests();
