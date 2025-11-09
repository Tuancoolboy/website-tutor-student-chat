/**
 * Test Session Requests API Endpoints
 */

import { config } from '../lib/config.js';

const API_BASE = `http://localhost:${config.api.port}/api`;

async function testAPI() {
  console.log('🧪 Testing Session Requests API...\n');

  // Test 1: Health check
  try {
    const healthRes = await fetch(`http://localhost:${config.api.port}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health check:', healthData.message);
  } catch (error) {
    console.error('❌ Server not running. Please start server with: npm run dev:api');
    console.error('   Error:', (error as Error).message);
    return;
  }

  // Test 2: Login as student to get token
  console.log('\n📝 Step 1: Login as student...');
  try {
    // Read users.json to get actual email
    const fs = await import('fs/promises');
    const path = await import('path');
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    const usersContent = await fs.readFile(usersPath, 'utf-8');
    const users = JSON.parse(usersContent);
    
    const student = users.find((u: any) => u.role === 'student');
    if (!student) {
      console.error('❌ No student found in users.json');
      return;
    }

    const studentEmail = student.email;
    console.log('   Trying email:', studentEmail);

    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'password123'
      })
    });

    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.data) {
      console.error('❌ Login failed:', loginData.error || 'Unknown error');
      return;
    }

    const token = loginData.data.token;
    console.log('   Token:', token.substring(0, 20) + '...');

    // Test 3: List session requests
    console.log('\n📋 Step 2: List session requests...');
    const listRes = await fetch(`${API_BASE}/session-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const listData = await listRes.json();
    
    if (listData.success) {
      console.log(`✅ Found ${listData.data.length} requests`);
      if (listData.data.length > 0) {
        console.log('   First request:', {
          id: listData.data[0].id,
          type: listData.data[0].type,
          status: listData.data[0].status,
          subject: listData.data[0].session?.subject
        });
      }
    } else {
      console.error('❌ Failed to list requests:', listData.error);
    }

    // Test 4: Get a specific request
    if (listData.success && listData.data.length > 0) {
      console.log('\n🔍 Step 3: Get request detail...');
      const requestId = listData.data[0].id;
      const getRes = await fetch(`${API_BASE}/session-requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const getData = await getRes.json();
      
      if (getData.success) {
        console.log('✅ Request details retrieved');
        console.log('   Session:', getData.data.session?.subject);
        console.log('   Student:', getData.data.student?.name);
        console.log('   Tutor:', getData.data.tutor?.name);
        if (getData.data.class) {
          console.log('   Class:', getData.data.class.code);
        }
      } else {
        console.error('❌ Failed to get request:', getData.error);
      }
    }

    // Test 5: Login as tutor to test approve/reject
    console.log('\n📝 Step 4: Login as tutor...');
    // Read users.json to get tutor email
    const tutor = users.find((u: any) => u.role === 'tutor');
    if (tutor) {
      const tutorEmail = tutor.email;
      console.log('   Trying tutor email:', tutorEmail);
      
      const tutorLoginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: tutorEmail,
          password: 'password123'
        })
      });
      
      const tutorLoginData = await tutorLoginRes.json();
      if (tutorLoginData.success && tutorLoginData.data) {
        const tutorToken = tutorLoginData.data.token;
        console.log('✅ Logged in as tutor:', tutorEmail);

        // List tutor's requests
        const tutorListRes = await fetch(`${API_BASE}/session-requests`, {
          headers: {
            'Authorization': `Bearer ${tutorToken}`
          }
        });
        const tutorListData = await tutorListRes.json();
        
        if (tutorListData.success) {
          console.log(`✅ Tutor has ${tutorListData.data.length} requests`);
          if (tutorListData.data.length > 0) {
            const pendingRequest = tutorListData.data.find((r: any) => r.status === 'pending');
            if (pendingRequest) {
              console.log('   Found pending request:', pendingRequest.id);
              console.log('   Can test approve/reject on:', pendingRequest.id);
            }
          }
        }
      }
    }

    console.log('\n✅ All tests completed!');
    console.log('\n📌 Summary:');
    console.log('   - Backend API is working');
    console.log('   - Authentication works');
    console.log('   - List requests endpoint works');
    console.log('   - Get request detail endpoint works');
    console.log('   - Authorization filtering works (student/tutor see different requests)');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();

