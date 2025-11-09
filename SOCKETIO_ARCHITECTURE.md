# Kiến Trúc Socket.io - Giải Thích

## 🔍 Socket.io Chạy Ở Đâu?

**Socket.io chạy TRÊN SERVER CỦA BẠN**, không phải website khác!

## 📊 Kiến Trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR WEBSITE                              │
│                                                              │
│  ┌──────────────┐          ┌──────────────────────────┐    │
│  │   Browser    │          │   Your Server            │    │
│  │  (Client)    │◄─────────►│   (Backend)              │    │
│  │              │  HTTP    │                          │    │
│  │  React App   │  REST API│  ┌────────────────────┐  │    │
│  │              │          │  │  Express Server    │  │    │
│  │              │          │  │  Port 3000         │  │    │
│  │              │          │  └────────────────────┘  │    │
│  │              │          │                          │    │
│  │              │◄─────────►│  ┌────────────────────┐  │    │
│  │              │  WebSocket│  │  Socket.io Server  │  │    │
│  │              │  (Real-time)│  │  Port 3000 (cùng) │  │    │
│  └──────────────┘          │  └────────────────────┘  │    │
│                             │                          │    │
│                             │  ┌────────────────────┐  │    │
│                             │  │  JSON Storage      │  │    │
│                             │  │  (data/*.json)     │  │    │
│                             │  └────────────────────┘  │    │
│                             └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Có 2 Cách Triển Khai:

### Cách 1: Tích Hợp Vào Cùng Express Server (Khuyến nghị) ✅

**Ưu điểm:**
- ✅ Đơn giản nhất
- ✅ Chỉ cần 1 port (3000)
- ✅ Dễ deploy
- ✅ Dùng chung authentication

**Cách hoạt động:**
```typescript
// server.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app); // Tạo HTTP server từ Express

// Socket.io sử dụng cùng HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

// REST API routes
app.get('/api/users', ...);

// WebSocket events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
});

// Start server
httpServer.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Kết nối:**
- REST API: `http://localhost:3000/api/...`
- WebSocket: `ws://localhost:3000` (tự động)

---

### Cách 2: Server Riêng (Port khác)

**Ưu điểm:**
- ✅ Tách biệt logic
- ✅ Scale riêng được

**Nhược điểm:**
- ⚠️ Phức tạp hơn
- ⚠️ Cần 2 ports
- ⚠️ Khó deploy hơn

**Cách hoạt động:**
```typescript
// server.ts (Express - Port 3000)
const app = express();
app.listen(3000, () => {
  console.log('API server on port 3000');
});

// ws-server.ts (Socket.io - Port 3001)
const io = new Server(3001, {
  cors: {
    origin: "http://localhost:5173"
  }
});
```

**Kết nối:**
- REST API: `http://localhost:3000/api/...`
- WebSocket: `ws://localhost:3001`

---

## 💡 Khuyến Nghị: Cách 1 (Cùng Server)

Với hệ thống của bạn, nên dùng **Cách 1** vì:

1. **Đơn giản:** Chỉ cần sửa `server.ts`
2. **Dễ deploy:** Chỉ 1 process, 1 port
3. **Shared auth:** Dùng chung JWT authentication
4. **Ít resource:** Không cần 2 servers

---

## 🔐 Luồng Hoạt Động

### 1. User Login
```
Browser → POST /api/auth/login → Express Server
         ← JWT Token
```

### 2. Kết Nối WebSocket
```
Browser → Connect to ws://localhost:3000
         → Send JWT Token
         ← Socket.io Connection Established
```

### 3. Nhắn Tin Real-time
```
User A → Send Message → Socket.io Server
                       → Save to Database
                       → Broadcast to User B
User B ← Receive Message (real-time)
```

---

## 📝 Ví Dụ Code

### Backend (server.ts)
```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

// Middleware để authenticate Socket.io connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('User connected:', socket.data.userId);
  
  // Join conversation room
  socket.on('join-room', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.data.userId} joined room ${conversationId}`);
  });
  
  // Send message
  socket.on('send-message', async (data) => {
    // Save message to database
    const message = await saveMessage(data);
    
    // Broadcast to all users in the conversation
    io.to(data.conversationId).emit('new-message', message);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.data.userId);
  });
});

httpServer.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Frontend (React)
```typescript
import { io } from 'socket.io-client';

// Kết nối đến server của bạn
const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('token') // JWT token
  }
});

// Join conversation room
socket.emit('join-room', conversationId);

// Send message
socket.emit('send-message', {
  conversationId: 'conv_123',
  content: 'Hello!',
  receiverId: 'user_456'
});

// Listen for new messages
socket.on('new-message', (message) => {
  console.log('New message:', message);
  // Update UI
});
```

---

## ❌ KHÔNG Phải Như Này:

```
❌ Browser → Website khác → Your Server
❌ Browser → Third-party service → Your Server
❌ Browser → External API → Your Server
```

## ✅ Mà Là Như Này:

```
✅ Browser → Your Server (trực tiếp)
✅ Browser → ws://localhost:3000 (trực tiếp)
✅ Browser → http://localhost:3000/api (trực tiếp)
```

---

## 🚀 Tóm Tắt

1. **Socket.io chạy trên server của bạn** (không phải website khác)
2. **Có thể tích hợp vào Express server hiện tại** (cùng port 3000)
3. **Client kết nối trực tiếp** đến server của bạn
4. **Không cần dịch vụ bên thứ ba** (trừ khi bạn muốn dùng cloud service)
5. **Tất cả đều trong hệ thống của bạn**

---

## 📚 Next Steps

1. ✅ Cài đặt Socket.io (đã xong)
2. ⏳ Tích hợp vào server.ts
3. ⏳ Tạo WebSocket event handlers
4. ⏳ Tạo React hook useWebSocket
5. ⏳ Tích hợp vào Messages component

