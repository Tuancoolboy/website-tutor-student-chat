/**
 * Script to create 2 test accounts (student and tutor) for testing chat
 * Usage: npm run create:test-accounts
 */

const API_BASE = 'http://localhost:3000/api';

interface User {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'tutor';
}

// Test users
const student: User = {
  email: 'student.test@hcmut.edu.vn',
  password: 'password123',
  name: 'Test Student',
  role: 'student'
};

const tutor: User = {
  email: 'tutor.test@hcmut.edu.vn',
  password: 'password123',
  name: 'Test Tutor',
  role: 'tutor'
};

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

// Create or login user
async function createOrLoginUser(user: User) {
  console.log(`\n📝 Processing ${user.role}: ${user.email}...`);

  // Try to register
  try {
    const registerResponse = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role
      })
    });

    if (registerResponse.data.success) {
      console.log(`✅ ${user.role} registered successfully`);
      return registerResponse.data.data;
    } else if (registerResponse.data.error?.includes('đã được sử dụng')) {
      console.log(`⚠️  ${user.role} already exists, trying to login...`);
    } else {
      console.error(`❌ Failed to register ${user.role}:`, registerResponse.data.error);
    }
  } catch (error) {
    console.log(`⚠️  Registration failed for ${user.role}, trying login...`);
  }

  // Try to login
  try {
    const loginResponse = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });

    if (loginResponse.data.success && loginResponse.data.data) {
      console.log(`✅ ${user.role} logged in successfully`);
      return loginResponse.data.data;
    } else {
      console.error(`❌ Failed to login ${user.role}:`, loginResponse.data.error);
      return null;
    }
  } catch (error: any) {
    console.error(`❌ Login error for ${user.role}:`, error.message);
    return null;
  }
}

// Create conversation between two users
async function createConversation(studentData: any, tutorData: any, studentToken: string) {
  console.log('\n📨 Creating conversation...');

  try {
    const response = await apiRequest('/conversations', {
      method: 'POST',
      token: studentToken,
      body: JSON.stringify({
        participantIds: [studentData.user.userId || studentData.user.id, tutorData.user.userId || tutorData.user.id]
      })
    });

    if (response.data.success && response.data.data) {
      console.log('✅ Conversation created:', response.data.data.id);
      return response.data.data;
    } else {
      // Conversation might already exist
      console.log('⚠️  Conversation might already exist, checking...');
      const listResponse = await apiRequest('/conversations', {
        token: studentToken
      });

      if (listResponse.data.success && listResponse.data.data) {
        const existingConv = listResponse.data.data.find((conv: any) => 
          conv.participants?.includes(studentData.user.userId || studentData.user.id) && 
          conv.participants?.includes(tutorData.user.userId || tutorData.user.id)
        );

        if (existingConv) {
          console.log('✅ Found existing conversation:', existingConv.id);
          return existingConv;
        }
      }
      return null;
    }
  } catch (error: any) {
    console.error('❌ Failed to create conversation:', error.message);
    return null;
  }
}

// Main function
async function main() {
  console.log('🚀 Creating Test Accounts for Chat Testing\n');
  console.log('='.repeat(60));

  // Check if API server is running
  try {
    const healthCheck = await fetch(`${API_BASE.replace('/api', '')}/health`);
    if (!healthCheck.ok) {
      console.error('❌ API server is not running!');
      console.error('   Please run: npm run api');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Cannot connect to API server!');
    console.error('   Please make sure API server is running: npm run api');
    process.exit(1);
  }

  // Create/Login student
  const studentData = await createOrLoginUser(student);
  if (!studentData) {
    console.error('\n❌ Failed to create/login student account');
    process.exit(1);
  }

  // Create/Login tutor
  const tutorData = await createOrLoginUser(tutor);
  if (!tutorData) {
    console.error('\n❌ Failed to create/login tutor account');
    process.exit(1);
  }

  // Create conversation
  const conversation = await createConversation(studentData, tutorData, studentData.token);
  if (!conversation) {
    console.log('\n⚠️  Could not create conversation, but accounts are ready');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Accounts Created Successfully!\n');
  console.log('📋 Account Information:');
  console.log(`   Student: ${student.email} / ${student.password}`);
  console.log(`   Tutor: ${tutor.email} / ${tutor.password}`);
  if (conversation) {
    console.log(`   Conversation ID: ${conversation.id}`);
  }
  console.log('\n💡 To test chat:');
  console.log('   1. Open http://localhost:5173 in browser');
  console.log('   2. Login as Student:', student.email);
  console.log('   3. Open another tab/window and login as Tutor:', tutor.email);
  console.log('   4. Navigate to Messages page in both tabs');
  console.log('   5. Select the conversation and start chatting!');
  console.log('\n');
}

// Run
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

