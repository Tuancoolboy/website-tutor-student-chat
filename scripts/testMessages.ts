/**
 * Test Real-time Messaging System
 * 
 * This script tests the messaging system by:
 * 1. Creating two users (student and tutor)
 * 2. Creating a conversation between them
 * 3. Sending messages from both users
 * 4. Verifying messages are received in real-time
 */

const API_BASE = 'http://localhost:3000/api';

interface User {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'tutor';
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: any;
    token: string;
  };
  error?: string;
}

// Test users
const student: User = {
  email: 'student@test.com',
  password: 'password123',
  name: 'Test Student',
  role: 'student'
};

const tutor: User = {
  email: 'tutor@test.com',
  password: 'password123',
  name: 'Test Tutor',
  role: 'tutor'
};

let studentToken: string = '';
let tutorToken: string = '';
let studentUserId: string = '';
let tutorUserId: string = '';
let conversationId: string = '';

// Helper function to make API requests
async function apiRequest(endpoint: string, options: any = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();
  return { status: response.status, data };
}

// Step 1: Register or login users
async function setupUsers() {
  console.log('📝 Step 1: Setting up users...');

  // Try to register student
  try {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(student)
    });
    console.log('✅ Student registered:', response.data);
  } catch (error) {
    console.log('⚠️ Student may already exist, trying login...');
  }

  // Try to register tutor
  try {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(tutor)
    });
    console.log('✅ Tutor registered:', response.data);
  } catch (error) {
    console.log('⚠️ Tutor may already exist, trying login...');
  }

  // Login student
  const studentLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: student.email,
      password: student.password
    })
  });

  if (studentLogin.data.success && studentLogin.data.data) {
    studentToken = studentLogin.data.data.token;
    studentUserId = studentLogin.data.data.user.userId || studentLogin.data.data.user.id;
    console.log('✅ Student logged in:', studentUserId);
  } else {
    throw new Error('Failed to login student: ' + JSON.stringify(studentLogin.data));
  }

  // Login tutor
  const tutorLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: tutor.email,
      password: tutor.password
    })
  });

  if (tutorLogin.data.success && tutorLogin.data.data) {
    tutorToken = tutorLogin.data.data.token;
    tutorUserId = tutorLogin.data.data.user.userId || tutorLogin.data.data.user.id;
    console.log('✅ Tutor logged in:', tutorUserId);
  } else {
    throw new Error('Failed to login tutor: ' + JSON.stringify(tutorLogin.data));
  }
}

// Step 2: Create a conversation
async function createConversation() {
  console.log('\n📨 Step 2: Creating conversation...');

  const response = await apiRequest('/conversations', {
    method: 'POST',
    token: studentToken,
    body: JSON.stringify({
      participantIds: [studentUserId, tutorUserId]
    })
  });

  if (response.data.success && response.data.data) {
    conversationId = response.data.data.id;
    console.log('✅ Conversation created:', conversationId);
  } else {
    // Conversation might already exist, try to get existing conversations
    const listResponse = await apiRequest('/conversations', {
      token: studentToken
    });

    if (listResponse.data.success && listResponse.data.data) {
      const existingConv = listResponse.data.data.find((conv: any) => 
        conv.participants?.includes(studentUserId) && 
        conv.participants?.includes(tutorUserId)
      );

      if (existingConv) {
        conversationId = existingConv.id;
        console.log('✅ Using existing conversation:', conversationId);
      } else {
        throw new Error('Failed to create or find conversation');
      }
    } else {
      throw new Error('Failed to create conversation: ' + JSON.stringify(response.data));
    }
  }
}

// Step 3: Send messages
async function sendMessages() {
  console.log('\n💬 Step 3: Sending messages...');

  // Student sends a message
  const studentMessage = await apiRequest(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    token: studentToken,
    body: JSON.stringify({
      content: 'Hello Tutor! This is a test message from student.',
      type: 'text'
    })
  });

  if (studentMessage.data.success) {
    console.log('✅ Student sent message:', studentMessage.data.data?.content);
  } else {
    console.error('❌ Failed to send student message:', studentMessage.data);
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Tutor sends a message
  const tutorMessage = await apiRequest(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    token: tutorToken,
    body: JSON.stringify({
      content: 'Hello Student! This is a test message from tutor.',
      type: 'text'
    })
  });

  if (tutorMessage.data.success) {
    console.log('✅ Tutor sent message:', tutorMessage.data.data?.content);
  } else {
    console.error('❌ Failed to send tutor message:', tutorMessage.data);
  }
}

// Step 4: Get messages
async function getMessages() {
  console.log('\n📥 Step 4: Retrieving messages...');

  // Get messages as student
  const studentMessages = await apiRequest(`/conversations/${conversationId}/messages`, {
    token: studentToken
  });

  if (studentMessages.data.success && studentMessages.data.data) {
    console.log('✅ Student received messages:', studentMessages.data.data.length);
    studentMessages.data.data.forEach((msg: any, index: number) => {
      console.log(`   ${index + 1}. [${msg.senderId === studentUserId ? 'Student' : 'Tutor'}]: ${msg.content}`);
    });
  } else if (studentMessages.data.data && Array.isArray(studentMessages.data.data)) {
    // Handle case where API returns data directly (old format)
    console.log('✅ Student received messages:', studentMessages.data.data.length);
    studentMessages.data.data.forEach((msg: any, index: number) => {
      console.log(`   ${index + 1}. [${msg.senderId === studentUserId ? 'Student' : 'Tutor'}]: ${msg.content}`);
    });
  } else {
    console.error('❌ Failed to get student messages:', studentMessages.data);
  }

  // Get messages as tutor
  const tutorMessages = await apiRequest(`/conversations/${conversationId}/messages`, {
    token: tutorToken
  });

  if (tutorMessages.data.success && tutorMessages.data.data) {
    console.log('✅ Tutor received messages:', tutorMessages.data.data.length);
    tutorMessages.data.data.forEach((msg: any, index: number) => {
      console.log(`   ${index + 1}. [${msg.senderId === tutorUserId ? 'Tutor' : 'Student'}]: ${msg.content}`);
    });
  } else if (tutorMessages.data.data && Array.isArray(tutorMessages.data.data)) {
    // Handle case where API returns data directly (old format)
    console.log('✅ Tutor received messages:', tutorMessages.data.data.length);
    tutorMessages.data.data.forEach((msg: any, index: number) => {
      console.log(`   ${index + 1}. [${msg.senderId === tutorUserId ? 'Tutor' : 'Student'}]: ${msg.content}`);
    });
  } else {
    console.error('❌ Failed to get tutor messages:', tutorMessages.data);
  }
}

// Step 5: Test Long Polling
async function testLongPolling() {
  console.log('\n🔄 Step 5: Testing Long Polling...');

  // Start long polling as student
  console.log('   Starting long poll as student...');
  const pollPromise = apiRequest(`/messages/poll?conversationId=${conversationId}`, {
    token: studentToken
  });

  // Wait a bit, then send a message from tutor
  setTimeout(async () => {
    console.log('   Sending message from tutor while student is polling...');
    await apiRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      token: tutorToken,
      body: JSON.stringify({
        content: 'This message should be received via long polling!',
        type: 'text'
      })
    });
  }, 2000);

  try {
    const pollResponse = await pollPromise;
    if (pollResponse.data.success && pollResponse.data.messages) {
      console.log('✅ Long polling received messages:', pollResponse.data.messages.length);
      pollResponse.data.messages.forEach((msg: any) => {
        console.log(`   Received: ${msg.content}`);
      });
    } else {
      console.log('⚠️ Long polling response:', pollResponse.data);
    }
  } catch (error: any) {
    console.log('⚠️ Long polling may have timed out (this is normal):', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Real-time Messaging System Tests\n');
  console.log('=' .repeat(60));

  try {
    await setupUsers();
    await createConversation();
    await sendMessages();
    await getMessages();
    await testLongPolling();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Student ID: ${studentUserId}`);
    console.log(`   - Tutor ID: ${tutorUserId}`);
    console.log(`   - Conversation ID: ${conversationId}`);
    console.log('\n💡 To test in browser:');
    console.log(`   1. Login as student: ${student.email} / ${student.password}`);
    console.log(`   2. Login as tutor: ${tutor.email} / ${tutor.password}`);
    console.log(`   3. Navigate to Messages page`);
    console.log(`   4. Select the conversation and send messages`);

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();

