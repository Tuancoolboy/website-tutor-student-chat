/**
 * Test Script for Online Status Feature
 * Simulates multiple users connecting to test Active Now functionality
 */

import { io, Socket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { config } from '../lib/config.js';

const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'http://localhost:3001';
const API_URL = process.env.API_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || config.jwt.secret;

// Test users (you can modify these to match your actual users)
// These should match users in your data/users.json file
// Default password for all users is: password123
const TEST_USERS = [
  {
    email: '2365732@hcmut.edu.vn', // Student: Phan An Hoàng
    password: 'password123',
    name: 'Student'
  },
  {
    email: 'hoang.nam.hoang@hcmut.edu.vn', // Tutor: Hoàng Nam Hoàng
    password: 'password123',
    name: 'Tutor'
  }
];

interface TestResult {
  user: string;
  connected: boolean;
  receivedOnlineEvents: string[];
  receivedOfflineEvents: string[];
  errors: string[];
}

async function loginUser(email: string, password: string): Promise<{ token: string; userId: string } | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.success && data.data?.token) {
      const token = data.data.token;
      // Decode token without verification to get userId (we trust the server)
      try {
        const decoded = jwt.decode(token) as any;
        const userId = decoded?.userId || decoded?.id || decoded?.user?.id || '';
        console.log(`   Token decoded successfully. userId: ${userId}`);
        console.log(`   Token preview: ${token.substring(0, 50)}...`);
        return { token, userId };
      } catch (decodeError) {
        console.error(`Failed to decode token for ${email}:`, decodeError);
        return null;
      }
    }
    console.error(`Login failed for ${email}:`, data);
    return null;
  } catch (error: any) {
    console.error(`Login error for ${email}:`, error.message);
    return null;
  }
}

function createSocketConnection(
  token: string, 
  userId: string,
  onConnected?: (data: { userId: string; socketId: string; onlineUsers?: string[] }) => void
): Promise<Socket> {
  return new Promise((resolve, reject) => {
    console.log(`🔌 Attempting to connect user ${userId} to ${WEBSOCKET_URL}...`);
    console.log(`   Token length: ${token.length}`);
    console.log(`   Token starts with: ${token.substring(0, 20)}...`);
    
    const socket = io(WEBSOCKET_URL, {
      auth: {
        token: token
      },
      extraHeaders: {
        // Also try sending in headers as fallback
        Authorization: `Bearer ${token}`
      },
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      reconnection: false,
      timeout: 10000,
      forceNew: true
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error(`Connection timeout for user ${userId} after 10 seconds`));
    }, 10000);

    // Register 'connected' event handler BEFORE connecting
    // This ensures we don't miss the event
    if (onConnected) {
      socket.on('connected', onConnected);
    }

    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log(`✅ User ${userId} connected (socket: ${socket.id})`);
      resolve(socket);
    });

    socket.on('connect_error', (error: any) => {
      console.error(`❌ Connection error for user ${userId}:`, error.message);
      if (error.type) {
        console.error(`   Error type: ${error.type}`);
      }
      if (error.description) {
        console.error(`   Error description: ${error.description}`);
      }
      console.error(`   Full error:`, error);
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(`Connection error for user ${userId}: ${error.message}`));
    });

    socket.on('disconnect', (reason) => {
      console.log(`⚠️ User ${userId} disconnected: ${reason}`);
    });

    socket.on('error', (error: any) => {
      console.error(`❌ Socket error for user ${userId}:`, error);
    });
  });
}

async function checkServerHealth(url: string, name: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log(`✅ ${name} server is running:`, data);
    return true;
  } catch (error: any) {
    console.error(`❌ ${name} server is not running or not accessible:`, error.message);
    console.error(`   Please make sure ${name} server is running on ${url}`);
    return false;
  }
}

async function testOnlineStatus() {
  console.log('🧪 Starting Online Status Test...\n');
  console.log(`WebSocket URL: ${WEBSOCKET_URL}`);
  console.log(`API URL: ${API_URL}\n`);

  // Check if servers are running
  console.log('🔍 Checking if servers are running...');
  const apiServerRunning = await checkServerHealth(API_URL, 'API');
  const wsServerRunning = await checkServerHealth(WEBSOCKET_URL, 'WebSocket');
  
  if (!apiServerRunning) {
    console.error('\n❌ API server is not running. Please start it with: npm run api');
    process.exit(1);
  }
  
  if (!wsServerRunning) {
    console.error('\n❌ WebSocket server is not running. Please start it with: npm run ws');
    process.exit(1);
  }
  
  console.log('');
  console.log('💡 IMPORTANT: Make sure WebSocket server is running with the latest code!');
  console.log('   Check the WebSocket server terminal for detailed logs.');
  console.log('');

  const results: TestResult[] = [];
  const sockets: Socket[] = [];
  const userData: Array<{ token: string; userId: string; name: string }> = [];

  try {
    // Step 1: Login users and get tokens
    console.log('📝 Step 1: Logging in users...');
    for (const user of TEST_USERS) {
      const loginResult = await loginUser(user.email, user.password);
      if (!loginResult) {
        console.error(`❌ Failed to login user: ${user.email}`);
        continue;
      }
      userData.push({
        token: loginResult.token,
        userId: loginResult.userId,
        name: user.name
      });
      console.log(`✅ Logged in: ${user.name} (${loginResult.userId})`);
    }

    if (userData.length < 2) {
      console.error('❌ Need at least 2 users to test. Please check login credentials.');
      return;
    }

    // Test token authentication with WebSocket server
    console.log('\n📝 Step 1.5: Testing token authentication...');
    try {
      const testToken = userData[0].token;
      const testResponse = await fetch(`${WEBSOCKET_URL}/api/test-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testToken}`
        },
        body: JSON.stringify({ token: testToken })
      });
      const testData = await testResponse.json();
      if (testData.success) {
        console.log(`✅ Token authentication test passed: ${testData.data.userId}`);
      } else {
        console.error(`❌ Token authentication test failed: ${testData.error} (${testData.errorName})`);
        console.error('   This means the token cannot be verified by WebSocket server.');
        console.error('   Possible causes:');
        console.error('   1. JWT_SECRET mismatch between API server and WebSocket server');
        console.error('   2. Token format issue');
        console.error('   3. WebSocket server needs to be restarted');
        return;
      }
    } catch (error: any) {
      console.error(`❌ Token authentication test error:`, error.message);
    }

    // Step 2: Connect first user
    console.log('\n📝 Step 2: Connecting first user...');
    const user1 = userData[0];
    const result1: TestResult = {
      user: user1.name,
      connected: true,
      receivedOnlineEvents: [],
      receivedOfflineEvents: [],
      errors: []
    };

    // Register event handlers BEFORE connecting to ensure we don't miss events
    const handleConnected1 = (data: { userId: string; socketId: string; onlineUsers?: string[] }) => {
      console.log(`📨 User 1 received 'connected' event with onlineUsers:`, data.onlineUsers);
      // Add initial online users to the list (should be empty for first user)
      if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
        data.onlineUsers.forEach(userId => {
          if (!result1.receivedOnlineEvents.includes(userId)) {
            console.log(`   Adding ${userId} to User 1's online list from 'connected' event`);
            result1.receivedOnlineEvents.push(userId);
          }
        });
      }
    };

    const socket1 = await createSocketConnection(user1.token, user1.userId, handleConnected1);
    sockets.push(socket1);

    socket1.on('user-online', (data: { userId: string }) => {
      console.log(`📨 User 1 received 'user-online' event: ${data.userId}`);
      if (!result1.receivedOnlineEvents.includes(data.userId)) {
        result1.receivedOnlineEvents.push(data.userId);
      }
    });

    socket1.on('user-offline', (data: { userId: string }) => {
      console.log(`📨 User 1 received 'user-offline' event: ${data.userId}`);
      result1.receivedOfflineEvents.push(data.userId);
    });

    socket1.on('error', (error: any) => {
      console.error(`❌ User 1 error:`, error);
      result1.errors.push(error.message || 'Unknown error');
    });

    // Wait a bit for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Connect second user
    console.log('\n📝 Step 3: Connecting second user...');
    const user2 = userData[1];
    const result2: TestResult = {
      user: user2.name,
      connected: true,
      receivedOnlineEvents: [],
      receivedOfflineEvents: [],
      errors: []
    };

    // Register event handlers BEFORE connecting to ensure we don't miss events
    const handleConnected2 = (data: { userId: string; socketId: string; onlineUsers?: string[] }) => {
      console.log(`📨 User 2 received 'connected' event with onlineUsers:`, data.onlineUsers);
      // Add initial online users to the list (should include User 1)
      if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
        data.onlineUsers.forEach(userId => {
          if (!result2.receivedOnlineEvents.includes(userId)) {
            console.log(`   Adding ${userId} to User 2's online list from 'connected' event`);
            result2.receivedOnlineEvents.push(userId);
          }
        });
      }
    };

    const socket2 = await createSocketConnection(user2.token, user2.userId, handleConnected2);
    sockets.push(socket2);

    socket2.on('user-online', (data: { userId: string }) => {
      console.log(`📨 User 2 received 'user-online' event: ${data.userId}`);
      if (!result2.receivedOnlineEvents.includes(data.userId)) {
        result2.receivedOnlineEvents.push(data.userId);
      }
    });

    socket2.on('user-offline', (data: { userId: string }) => {
      console.log(`📨 User 2 received 'user-offline' event: ${data.userId}`);
      result2.receivedOfflineEvents.push(data.userId);
    });

    socket2.on('error', (error: any) => {
      console.error(`❌ User 2 error:`, error);
      result2.errors.push(error.message || 'Unknown error');
    });

    // Wait for events to propagate
    console.log('\n⏳ Waiting for events to propagate...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Check results
    console.log('\n📊 Test Results:');
    console.log('═══════════════════════════════════════════════════════');
    
    results.push(result1, result2);

    for (const result of results) {
      console.log(`\n👤 ${result.user}:`);
      console.log(`   Connected: ${result.connected ? '✅' : '❌'}`);
      console.log(`   Received online events: ${result.receivedOnlineEvents.length}`);
      result.receivedOnlineEvents.forEach(userId => {
        console.log(`     - ${userId}`);
      });
      console.log(`   Received offline events: ${result.receivedOfflineEvents.length}`);
      result.receivedOfflineEvents.forEach(userId => {
        console.log(`     - ${userId}`);
      });
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.length}`);
        result.errors.forEach(error => {
          console.log(`     - ${error}`);
        });
      }
    }

    // Step 5: Test offline
    console.log('\n📝 Step 5: Testing disconnect...');
    console.log('Disconnecting user 1...');
    socket1.disconnect();
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`\n📊 After disconnect:`);
    console.log(`User 2 received offline events: ${result2.receivedOfflineEvents.length}`);
    result2.receivedOfflineEvents.forEach(userId => {
      console.log(`   - ${userId}`);
    });

    // Step 6: Test API endpoint
    console.log('\n📝 Step 6: Testing API endpoint...');
    try {
      const response = await fetch(`${WEBSOCKET_URL}/api/online-users`);
      const data = await response.json();
      console.log(`Online users API response:`, data);
      if (data.success) {
        console.log(`✅ Online users: ${data.data.length}`);
        data.data.forEach((userId: string) => {
          console.log(`   - ${userId}`);
        });
      }
    } catch (error: any) {
      console.error(`❌ API endpoint error:`, error.message);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    sockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });

    // Final assessment
    console.log('\n📋 Final Assessment:');
    console.log('═══════════════════════════════════════════════════════');
    
    const user1ShouldSeeUser2 = result1.receivedOnlineEvents.includes(user2.userId);
    const user2ShouldSeeUser1 = result2.receivedOnlineEvents.includes(user1.userId);
    const user2ShouldSeeUser1Offline = result2.receivedOfflineEvents.includes(user1.userId);

    console.log(`User 1 (${user1.userId}) sees User 2 (${user2.userId}) online: ${user1ShouldSeeUser2 ? '✅' : '❌'}`);
    console.log(`User 2 (${user2.userId}) sees User 1 (${user1.userId}) online: ${user2ShouldSeeUser1 ? '✅' : '❌'}`);
    console.log(`User 2 sees User 1 offline: ${user2ShouldSeeUser1Offline ? '✅' : '❌'}`);

    if (user1ShouldSeeUser2 && user2ShouldSeeUser1 && user2ShouldSeeUser1Offline) {
      console.log('\n✅ All tests passed! Active Now should work correctly.');
    } else {
      console.log('\n❌ Some tests failed. Please check the WebSocket server implementation.');
      console.log('\n💡 Possible issues:');
      if (!user1ShouldSeeUser2) {
        console.log('   - User 1 did not receive user-online event for User 2');
      }
      if (!user2ShouldSeeUser1) {
        console.log('   - User 2 did not receive user-online event for User 1');
        console.log('   - This might be because User 1 connected first, and User 2 needs to know about existing online users');
      }
      if (!user2ShouldSeeUser1Offline) {
        console.log('   - User 2 did not receive user-offline event when User 1 disconnected');
      }
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    sockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
  }
}

// Run test
testOnlineStatus().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test error:', error);
  process.exit(1);
});

