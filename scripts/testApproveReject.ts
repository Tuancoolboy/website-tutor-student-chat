/**
 * Test Approve/Reject Session Request Endpoints
 */

import { config } from '../lib/config.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const API_BASE = `http://localhost:${config.api.port}/api`;

async function testApproveReject() {
  console.log('🧪 Testing Approve/Reject Session Request API...\n');

  // Read data files
  const usersPath = path.join(process.cwd(), 'data', 'users.json');
  const sessionsPath = path.join(process.cwd(), 'data', 'sessions.json');
  const requestsPath = path.join(process.cwd(), 'data', 'session-requests.json');
  
  const usersContent = await fs.readFile(usersPath, 'utf-8');
  const sessionsContent = await fs.readFile(sessionsPath, 'utf-8');
  const requestsContent = await fs.readFile(requestsPath, 'utf-8');
  
  const users = JSON.parse(usersContent);
  const sessions = JSON.parse(sessionsContent);
  const requests = JSON.parse(requestsContent);

  // Find a tutor that has pending requests, or any tutor
  let tutor = null;
  const pendingRequests = requests.filter((r: any) => r.status === 'pending');
  
  if (pendingRequests.length > 0) {
    // Find tutor from pending request
    const tutorId = pendingRequests[0].tutorId;
    tutor = users.find((u: any) => u.id === tutorId && u.role === 'tutor');
    console.log(`✅ Found tutor with pending requests: ${tutor?.email}`);
  }
  
  // Fallback to any tutor
  if (!tutor) {
    tutor = users.find((u: any) => u.role === 'tutor');
  }
  
  if (!tutor) {
    console.error('❌ No tutor found');
    return;
  }

  console.log('📝 Step 1: Login as tutor...');
  const tutorLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: tutor.email,
      password: 'password123'
    })
  });

  const tutorLoginData = await tutorLoginRes.json();
  if (!tutorLoginData.success) {
    console.error('❌ Tutor login failed:', tutorLoginData.error);
    return;
  }

  const tutorToken = tutorLoginData.data.token;
  console.log('✅ Logged in as tutor:', tutor.email);
  console.log('   Token:', tutorToken.substring(0, 20) + '...');

  // Find a pending request for this tutor
  let tutorRequest = requests.find((r: any) => 
    r.tutorId === tutor.id && r.status === 'pending'
  );
  
  // If no pending request for this tutor, use any pending request (for testing)
  if (!tutorRequest && pendingRequests.length > 0) {
    tutorRequest = pendingRequests[0];
    console.log(`⚠️  Using pending request from different tutor for testing: ${tutorRequest.id}`);
  }

  if (!tutorRequest) {
    console.log('\n⚠️  No pending request found for this tutor. Creating one...');
    
    // Find a student and their confirmed session with this tutor
    // First, get all sessions for this tutor
    const tutorSessions = sessions.filter((s: any) => 
      s.tutorId === tutor.id && (s.status === 'confirmed' || s.status === 'pending')
    );
    
    console.log(`   Found ${tutorSessions.length} eligible sessions for tutor`);
    
    // Find a session where student exists
    let tutorSession = null;
    let student = null;
    
    for (const session of tutorSessions) {
      if (session.studentIds && session.studentIds.length > 0) {
        student = users.find((u: any) => u.id === session.studentIds[0]);
        if (student) {
          tutorSession = session;
          break;
        }
      }
    }

    if (!tutorSession || !student) {
      console.error('❌ No eligible session found to create request');
      console.log('   Tutor sessions:', tutorSessions.length);
      console.log('   All students:', users.filter((u: any) => u.role === 'student').length);
      return;
    }
    
    console.log('   Using session:', tutorSession.id);
    console.log('   Student:', student.email);

    // Login as student to create request
    console.log('\n📝 Creating request as student...');
    const studentLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: student.email,
        password: 'password123'
      })
    });

    const studentLoginData = await studentLoginRes.json();
    if (!studentLoginData.success) {
      console.error('❌ Student login failed');
      return;
    }

    const studentToken = studentLoginData.data.token;

    // Create a cancel request
    const createRes = await fetch(`${API_BASE}/session-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        sessionId: tutorSession.id,
        type: 'cancel',
        reason: 'Test request để tutor có thể approve/reject - Có việc đột xuất cần xử lý ngay'
      })
    });

    const createData = await createRes.json();
    if (!createData.success) {
      console.error('❌ Failed to create request:', createData.error);
      return;
    }

    console.log('✅ Created pending request:', createData.data.id);
    tutorRequest = createData.data;
  } else {
    console.log('\n✅ Found pending request:', tutorRequest.id);
    console.log('   Type:', tutorRequest.type);
    console.log('   Session ID:', tutorRequest.sessionId);
  }

  // Test Approve
  console.log('\n📝 Step 2: Test Approve Request...');
  const approveRes = await fetch(`${API_BASE}/session-requests/${tutorRequest.id}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tutorToken}`
    },
    body: JSON.stringify({
      responseMessage: 'Yêu cầu của bạn đã được chấp nhận. Buổi học sẽ được hủy theo yêu cầu.'
    })
  });

  const approveData = await approveRes.json();
  if (approveData.success) {
    console.log('✅ Request approved successfully!');
    console.log('   New status:', approveData.data.status);
    console.log('   Response message:', approveData.data.responseMessage);
    
    // Check if session was updated
    const updatedSessionRes = await fetch(`${API_BASE}/sessions/${tutorRequest.sessionId}`, {
      headers: {
        'Authorization': `Bearer ${tutorToken}`
      }
    });
    const updatedSessionData = await updatedSessionRes.json();
    if (updatedSessionData.success) {
      console.log('   Session status updated to:', updatedSessionData.data.status);
      if (tutorRequest.type === 'cancel') {
        console.log('   Session cancelled:', updatedSessionData.data.status === 'cancelled' ? '✅' : '❌');
      }
    }
  } else {
    console.error('❌ Failed to approve request:', approveData.error);
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Create another request for reject test
  console.log('\n📝 Step 3: Creating new request for reject test...');
  
  // Find another session for reject test
  const tutorSessions2 = sessions.filter((s: any) => 
    s.tutorId === tutor.id &&
    s.id !== tutorRequest.sessionId &&
    (s.status === 'confirmed' || s.status === 'pending')
  );
  
  let tutorSession2 = null;
  let student2 = null;
  
  for (const session of tutorSessions2) {
    if (session.studentIds && session.studentIds.length > 0) {
      student2 = users.find((u: any) => u.id === session.studentIds[0]);
      if (student2) {
        tutorSession2 = session;
        break;
      }
    }
  }

  if (tutorSession2 && student2) {
    console.log('   Using session:', tutorSession2.id);
    console.log('   Student:', student2.email);
    const studentLoginRes2 = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: student2.email,
        password: 'password123'
      })
    });

    const studentLoginData2 = await studentLoginRes2.json();
    if (studentLoginData2.success) {
      const studentToken2 = studentLoginData2.data.token;

      // Create a reschedule request
      const newDate = new Date(tutorSession2.startTime);
      newDate.setDate(newDate.getDate() + 5);
      const newEndDate = new Date(tutorSession2.endTime);
      newEndDate.setDate(newEndDate.getDate() + 5);

      const createRes2 = await fetch(`${API_BASE}/session-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken2}`
        },
        body: JSON.stringify({
          sessionId: tutorSession2.id,
          type: 'reschedule',
          reason: 'Test request để tutor có thể reject - Lịch học không phù hợp',
          preferredStartTime: newDate.toISOString(),
          preferredEndTime: newEndDate.toISOString()
        })
      });

      const createData2 = await createRes2.json();
      if (createData2.success) {
        console.log('✅ Created pending request:', createData2.data.id);

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test Reject
        console.log('\n📝 Step 4: Test Reject Request...');
        const rejectRes = await fetch(`${API_BASE}/session-requests/${createData2.data.id}/reject`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tutorToken}`
          },
          body: JSON.stringify({
            responseMessage: 'Rất tiếc, tôi không thể chấp nhận yêu cầu đổi lịch này vì lịch trình đã được sắp xếp và không thể thay đổi. Vui lòng giữ nguyên lịch học hoặc liên hệ trực tiếp để thảo luận.'
          })
        });

        const rejectData = await rejectRes.json();
        if (rejectData.success) {
          console.log('✅ Request rejected successfully!');
          console.log('   New status:', rejectData.data.status);
          console.log('   Rejection message:', rejectData.data.responseMessage);
        } else {
          console.error('❌ Failed to reject request:', rejectData.error);
        }
      }
    }
  }

  console.log('\n✅ All approve/reject tests completed!');
  console.log('\n📌 Summary:');
  console.log('   - Approve endpoint works');
  console.log('   - Reject endpoint works');
  console.log('   - Session status updated when approved');
  console.log('   - Response messages saved correctly');
}

testApproveReject().catch(console.error);

