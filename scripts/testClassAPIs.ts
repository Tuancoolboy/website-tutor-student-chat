/**
 * Test script for Class and Enrollment APIs
 * Run with: npx tsx scripts/testClassAPIs.ts
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// Test users - update these with actual user IDs from your database
const TUTOR_EMAIL = 'tutor1@example.com';
const TUTOR_PASSWORD = 'password123';
const STUDENT_EMAIL = 'student1@example.com';
const STUDENT_PASSWORD = 'password123';

let tutorToken = '';
let studentToken = '';
let classId = '';
let enrollmentId = '';

async function login(email: string, password: string): Promise<string> {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    });
    return response.data.data.token;
  } catch (error: any) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testCreateClass() {
  console.log('\n=== Test 1: Create Class ===');
  try {
    const response = await axios.post(
      `${API_BASE}/classes`,
      {
        code: 'C01',
        subject: 'Toán cao cấp',
        description: 'Lớp học Toán cao cấp cho sinh viên năm nhất',
        day: 'monday',
        startTime: '08:00',
        endTime: '10:00',
        duration: 120,
        maxStudents: 30,
        semesterStart: '2025-11-01T00:00:00.000Z',
        semesterEnd: '2026-02-28T23:59:59.999Z',
        isOnline: true
      },
      {
        headers: { Authorization: `Bearer ${tutorToken}` }
      }
    );
    classId = response.data.data.id;
    console.log('✅ Class created successfully:', response.data.data);
    console.log('Class ID:', classId);
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
}

async function testListClasses() {
  console.log('\n=== Test 2: List Classes ===');
  try {
    const response = await axios.get(`${API_BASE}/classes?availableOnly=true`);
    console.log('✅ Classes listed:', response.data.data.length, 'classes found');
    if (response.data.data.length > 0) {
      console.log('First class:', response.data.data[0]);
    }
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
}

async function testGetClass() {
  console.log('\n=== Test 3: Get Class Details ===');
  try {
    const response = await axios.get(`${API_BASE}/classes/${classId}`);
    console.log('✅ Class details:', response.data.data);
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
}

async function testEnrollClass() {
  console.log('\n=== Test 4: Student Enroll in Class ===');
  try {
    const response = await axios.post(
      `${API_BASE}/enrollments`,
      {
        classId: classId
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );
    enrollmentId = response.data.data.id;
    console.log('✅ Enrolled successfully:', response.data.data);
    console.log('Enrollment ID:', enrollmentId);
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
}

async function testListEnrollments() {
  console.log('\n=== Test 5: List Enrollments ===');
  try {
    const response = await axios.get(`${API_BASE}/enrollments`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log('✅ Enrollments listed:', response.data.data.length, 'enrollments found');
    if (response.data.data.length > 0) {
      console.log('First enrollment:', response.data.data[0]);
    }
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
}

async function testGenerateSessions() {
  console.log('\n=== Test 6: Generate Sessions for Class ===');
  try {
    const response = await axios.post(
      `${API_BASE}/classes/${classId}/generate-sessions`,
      {},
      {
        headers: { Authorization: `Bearer ${tutorToken}` }
      }
    );
    console.log('✅ Sessions generated:', response.data.data);
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
}

async function testDuplicateEnrollment() {
  console.log('\n=== Test 7: Try Duplicate Enrollment (Should Fail) ===');
  try {
    await axios.post(
      `${API_BASE}/enrollments`,
      {
        classId: classId
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );
    console.log('❌ Should have failed but succeeded!');
  } catch (error: any) {
    console.log('✅ Correctly rejected duplicate enrollment:', error.response?.data?.error);
  }
}

async function testUpdateClass() {
  console.log('\n=== Test 8: Update Class ===');
  try {
    const response = await axios.put(
      `${API_BASE}/classes/${classId}`,
      {
        description: 'Lớp học Toán cao cấp cho sinh viên năm nhất - ĐÃ CẬP NHẬT',
        maxStudents: 35
      },
      {
        headers: { Authorization: `Bearer ${tutorToken}` }
      }
    );
    console.log('✅ Class updated:', response.data.data);
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
}

async function testDropEnrollment() {
  console.log('\n=== Test 9: Drop Enrollment ===');
  try {
    const response = await axios.put(
      `${API_BASE}/enrollments/${enrollmentId}`,
      {
        status: 'dropped',
        notes: 'Dropped due to schedule conflict'
      },
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );
    console.log('✅ Enrollment dropped:', response.data.data);
  } catch (error: any) {
    console.error('❌ Failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Class & Enrollment API Tests...\n');
  
  try {
    // Login
    console.log('Logging in as tutor...');
    tutorToken = await login(TUTOR_EMAIL, TUTOR_PASSWORD);
    console.log('✅ Tutor logged in');
    
    console.log('Logging in as student...');
    studentToken = await login(STUDENT_EMAIL, STUDENT_PASSWORD);
    console.log('✅ Student logged in');
    
    // Run tests
    await testCreateClass();
    await testListClasses();
    await testGetClass();
    await testEnrollClass();
    await testListEnrollments();
    await testGenerateSessions();
    await testDuplicateEnrollment();
    await testUpdateClass();
    await testDropEnrollment();
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

runTests();

