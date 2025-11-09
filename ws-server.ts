/**
 * WebSocket Server for Real-Time Messaging
 * Deploy this separately on Railway, Render, or similar platform
 * 
 * This server handles Socket.io connections for real-time messaging
 * Vercel Serverless Functions don't support WebSocket, so we need a separate server
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { config } from './lib/config.js';
import { storage } from './lib/storage.js';
import { Message, Conversation } from './lib/types.js';
import { generateId, now } from './lib/utils.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || config.frontend.url,
  credentials: true
}));
app.use(express.json());

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || config.frontend.url || '*',
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true // Allow Engine.IO v3 clients
});

// Log when server is ready
console.log('[Socket.io] Server initialized');
console.log('[Socket.io] CORS origin:', process.env.FRONTEND_URL || config.frontend.url || '*');
console.log('[Socket.io] JWT Secret:', (process.env.JWT_SECRET || config.jwt.secret).substring(0, 10) + '...');

// Socket.io authentication middleware
io.use((socket, next) => {
  console.log('[Socket.io] New connection attempt from:', socket.handshake.address);
  console.log('[Socket.io] Handshake auth:', JSON.stringify(socket.handshake.auth));
  console.log('[Socket.io] Handshake headers:', JSON.stringify(socket.handshake.headers));
  
  try {
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
                  socket.handshake.query?.token;
    
    if (!token) {
      console.error('[Socket.io] No token provided in handshake');
      console.error('   auth:', socket.handshake.auth);
      console.error('   headers authorization:', socket.handshake.headers?.authorization);
      console.error('   query:', socket.handshake.query);
      return next(new Error('Authentication token required'));
    }

    console.log('[Socket.io] Token found, length:', token.length);
    console.log('[Socket.io] Token preview:', token.substring(0, 50) + '...');

    const jwtSecret = process.env.JWT_SECRET || config.jwt.secret;
    console.log('[Socket.io] Verifying token with secret:', jwtSecret.substring(0, 10) + '...');
    
    const payload = jwt.verify(token, jwtSecret) as any;
    
    if (!payload || !payload.userId) {
      console.error('[Socket.io] Token payload missing userId:', payload);
      return next(new Error('Invalid token: missing userId'));
    }

    console.log('[Socket.io] ✅ Token verified successfully. userId:', payload.userId);

    // Attach user info to socket
    socket.data.userId = payload.userId;
    socket.data.userRole = payload.role;
    next();
  } catch (error: any) {
    console.error('[Socket.io] ❌ Authentication error:', error.message);
    console.error('[Socket.io] Error name:', error.name);
    console.error('[Socket.io] Error stack:', error.stack);
    if (error.name === 'JsonWebTokenError') {
      console.error('[Socket.io] JWT Error - Token may be invalid or secret mismatch');
      console.error('[Socket.io] JWT Error message:', error.message);
    } else if (error.name === 'TokenExpiredError') {
      console.error('[Socket.io] Token expired');
    } else if (error.name === 'NotBeforeError') {
      console.error('[Socket.io] Token not active yet');
    }
    next(new Error('Authentication failed: ' + error.message));
  }
});

// Online users tracking (in-memory store)
// In production, you might want to use Redis or a database
const onlineUsers = new Map<string, { userId: string; socketId: string; connectedAt: Date }>();

// Socket.io connection handler
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  console.log(`[Socket.io] ✅ User connected successfully: ${userId} (${socket.id})`);

  // Get list of online users BEFORE adding the new user
  const currentOnlineUsers = Array.from(onlineUsers.keys());
  console.log(`[Socket.io] Current online users (before adding ${userId}):`, currentOnlineUsers);

  // Track online user
  onlineUsers.set(userId, {
    userId,
    socketId: socket.id,
    connectedAt: new Date()
  });

  // Join user's personal room for notifications
  socket.join(`user:${userId}`);

  // Send list of currently online users to the newly connected client
  // (excluding the current user who just connected)
  console.log(`[Socket.io] Emitting 'connected' event to ${userId} with onlineUsers:`, currentOnlineUsers);
  socket.emit('connected', { 
    userId, 
    socketId: socket.id,
    onlineUsers: currentOnlineUsers // Send list of users who were already online
  });

  // Broadcast user online status to all OTHER connected clients (excluding self)
  console.log(`[Socket.io] Broadcasting 'user-online' event for ${userId} to all other clients`);
  socket.broadcast.emit('user-online', { userId });

  // Join conversation room
  socket.on('join-room', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`[Socket.io] User ${userId} joined conversation ${conversationId}`);
    
    // Notify others in the room
    socket.to(`conversation:${conversationId}`).emit('user-joined', {
      userId,
      conversationId
    });
  });

  // Leave conversation room
  socket.on('leave-room', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`[Socket.io] User ${userId} left conversation ${conversationId}`);
    
    // Notify others in the room
    socket.to(`conversation:${conversationId}`).emit('user-left', {
      userId,
      conversationId
    });
  });

  // Send message
  socket.on('send-message', async (data: {
    conversationId: string;
    content: string;
    type?: 'text' | 'file' | 'image';
    fileUrl?: string;
  }) => {
    try {
      const { conversationId, content, type = 'text', fileUrl } = data;

      if (!content || content.trim().length === 0) {
        socket.emit('error', { message: 'Nội dung tin nhắn không được để trống' });
        return;
      }

      // Verify conversation exists and user is a participant
      const conversation = await storage.findById<Conversation>('conversations.json', conversationId);
      if (!conversation) {
        socket.emit('error', { message: 'Không tìm thấy cuộc trò chuyện' });
        return;
      }

      if (!conversation.participants.includes(userId)) {
        socket.emit('error', { message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này' });
        return;
      }

      // Get receiver
      const receiverId = conversation.participants.find(id => id !== userId);
      if (!receiverId) {
        socket.emit('error', { message: 'Không tìm thấy người nhận' });
        return;
      }

      // Create message
      const newMessage: Message = {
        id: generateId('msg'),
        conversationId,
        senderId: userId,
        receiverId,
        content: content.trim(),
        type,
        fileUrl,
        read: false,
        createdAt: now()
      };

      // Save message
      await storage.create('messages.json', newMessage);

      // Update conversation
      await storage.update<Conversation>('conversations.json', conversationId, {
        updatedAt: now(),
        lastMessage: newMessage
      });

      // Increment unread count
      const updatedUnreadCount = {
        ...conversation.unreadCount,
        [receiverId]: (conversation.unreadCount[receiverId] || 0) + 1
      };
      await storage.update<Conversation>('conversations.json', conversationId, {
        unreadCount: updatedUnreadCount
      });

      // Broadcast to all users in the conversation room
      io.to(`conversation:${conversationId}`).emit('new-message', newMessage);

      // Also send to receiver's personal room (for notifications)
      io.to(`user:${receiverId}`).emit('new-message', newMessage);

      console.log(`[Socket.io] Message sent: ${newMessage.id} in conversation ${conversationId}`);
    } catch (error: any) {
      console.error('[Socket.io] Error sending message:', error);
      socket.emit('error', { message: 'Lỗi gửi tin nhắn: ' + error.message });
    }
  });

  // Typing indicator
  socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
    socket.to(`conversation:${data.conversationId}`).emit('user-typing', {
      userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping
    });
  });

  // Mark message as read
  socket.on('mark-read', async (messageId: string) => {
    try {
      const message = await storage.findById<Message>('messages.json', messageId);
      if (!message || message.receiverId !== userId || message.read) {
        return;
      }

      await storage.update<Message>('messages.json', messageId, { read: true });

      // Update conversation unread count
      const conversation = await storage.findById<Conversation>('conversations.json', message.conversationId);
      if (conversation) {
        const updatedUnreadCount = {
          ...conversation.unreadCount,
          [userId]: Math.max(0, (conversation.unreadCount[userId] || 0) - 1)
        };
        await storage.update<Conversation>('conversations.json', message.conversationId, {
          unreadCount: updatedUnreadCount
        });
      }

      // Notify sender
      io.to(`user:${message.senderId}`).emit('message-read', {
        messageId,
        conversationId: message.conversationId,
        readBy: userId
      });
    } catch (error: any) {
      console.error('[Socket.io] Error marking message as read:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket.io] User disconnected: ${userId} (${socket.id})`);
    
    // Remove from online users
    onlineUsers.delete(userId);
    
    // Broadcast user offline status to all connected clients
    io.emit('user-offline', { userId });
  });
});

// API endpoint to get online users
app.get('/api/online-users', async (req, res) => {
  try {
    const onlineUserIds = Array.from(onlineUsers.keys());
    res.json({
      success: true,
      data: onlineUserIds,
      count: onlineUserIds.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to verify JWT token (for debugging)
app.post('/api/test-auth', async (req, res) => {
  try {
    const token = req.body.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token required'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || config.jwt.secret;
    console.log('[Test Auth] Verifying token with secret:', jwtSecret.substring(0, 10) + '...');
    console.log('[Test Auth] Token preview:', token.substring(0, 50) + '...');
    
    try {
      const payload = jwt.verify(token, jwtSecret) as any;
      console.log('[Test Auth] ✅ Token verified successfully. userId:', payload.userId);
      res.json({
        success: true,
        data: {
          userId: payload.userId,
          email: payload.email,
          role: payload.role
        }
      });
    } catch (error: any) {
      console.error('[Test Auth] ❌ Token verification failed:', error.message);
      console.error('[Test Auth] Error name:', error.name);
      res.status(401).json({
        success: false,
        error: error.message,
        errorName: error.name
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'websocket-server',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🔌 WebSocket Server for Real-Time Messaging          ║
║                                                              ║
║  Status: ✅ Running                                          ║
║  Port: ${PORT}                                                  ║
║  Environment: ${process.env.NODE_ENV || 'development'}      ║
║                                                              ║
║  WebSocket: ws://localhost:${PORT}                            ║
║  Health Check: http://localhost:${PORT}/health                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default httpServer;

