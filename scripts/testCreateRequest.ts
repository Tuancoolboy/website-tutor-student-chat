/**
 * Test creating a new session request
 */

import { config } from '../lib/config.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const API_BASE = `http://localhost:${config.api.port}/api`;

async function testCreateRequest() {
  console.log('🧪 Testing Create Session Request API...\n');

  // Read users and sessions
  const usersPath = path.join(process.cwd(), 'data', 'users.json');
  const sessionsPath = path.join(process.cwd(), 'data', 'sessions.json');
  
  const usersContent = await fs.readFile(usersPath, 'utf-8');
  const sessionsContent = await fs.readFile(sessionsPath, 'utf-8');
  
  const users = JSON.parse(usersContent);
  const sessions = JSON.parse(sessionsContent);

  // Find a student and their session
  const student = users.find((u: any) => u.role === 'student');
  if (!student) {
    console.error('❌ No student found');
    return;
  }

  // Find a confirmed session for this student
  const studentSession = sessions.find((s: any) => 
    s.studentIds?.includes(student.id) && 
    (s.status === 'confirmed' || s.status === 'pending')
  );

  if (!studentSession) {
    console.error('❌ No eligible session found for student');
    return;
  }

  console.log('📝 Step 1: Login as student...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: student.email,
      password: 'password123'
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('❌ Login failed:', loginData.error);
    return;
  }

  const token = loginData.data.token;
  console.log('✅ Logged in as:', student.email);

  console.log('\n📝 Step 2: Create cancel request...');
  const createCancelRes = await fetch(`${API_BASE}/session-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      sessionId: studentSession.id,
      type: 'cancel',
      reason: 'Tôi cần hủy buổi học này vì có việc đột xuất quan trọng cần giải quyết'
    })
  });

  const createCancelData = await createCancelRes.json();
  if (createCancelData.success) {
    console.log('✅ Cancel request created:', createCancelData.data.id);
    console.log('   Session:', createCancelData.data.session?.subject);
  } else {
    console.error('❌ Failed to create cancel request:', createCancelData.error);
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n📝 Step 3: Create reschedule request...');
  // Find another session
  const anotherSession = sessions.find((s: any) => 
    s.studentIds?.includes(student.id) && 
    s.id !== studentSession.id &&
    (s.status === 'confirmed' || s.status === 'pending')
  );

  if (anotherSession) {
    const newDate = new Date(anotherSession.startTime);
    newDate.setDate(newDate.getDate() + 3);
    const newEndDate = new Date(anotherSession.endTime);
    newEndDate.setDate(newEndDate.getDate() + 3);

    const createRescheduleRes = await fetch(`${API_BASE}/session-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sessionId: anotherSession.id,
        type: 'reschedule',
        reason: 'Tôi muốn đổi lịch học này sang ngày khác vì lịch trình cá nhân',
        preferredStartTime: newDate.toISOString(),
        preferredEndTime: newEndDate.toISOString()
      })
    });

    const createRescheduleData = await createRescheduleRes.json();
    if (createRescheduleData.success) {
      console.log('✅ Reschedule request created:', createRescheduleData.data.id);
      console.log('   Session:', createRescheduleData.data.session?.subject);
      console.log('   Preferred time:', new Date(createRescheduleData.data.preferredStartTime).toLocaleString('vi-VN'));
    } else {
      console.error('❌ Failed to create reschedule request:', createRescheduleData.error);
    }
  }

  console.log('\n✅ Create request tests completed!');
}

testCreateRequest().catch(console.error);

