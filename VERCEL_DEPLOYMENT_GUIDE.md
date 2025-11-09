# Hướng Dẫn Deploy Real-Time Messaging Lên Vercel

## ⚠️ Vấn Đề: Vercel Không Hỗ Trợ WebSocket

**Vercel Serverless Functions KHÔNG hỗ trợ WebSocket persistent connections.**

Socket.io cần persistent connections, điều này không tương thích với serverless architecture của Vercel.

## ✅ Giải Pháp: Tách WebSocket Server Riêng

### Kiến Trúc Đề Xuất:

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend + REST API)          │
│  https://hcmut-tutor.vercel.app                         │
│  ├── Frontend (React)                                   │
│  └── REST API (Serverless Functions)                    │
│      └── /api/conversations                             │
│      └── /api/conversations/:id/messages                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTP Requests
                  │
┌─────────────────▼───────────────────────────────────────┐
│           WEBSOCKET SERVER (Railway/Render)             │
│  wss://your-websocket-server.railway.app               │
│  ├── Socket.io Server                                   │
│  └── Real-time messaging                                │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Giải Pháp 1: Railway (Khuyến nghị)

### Bước 1: Tạo WebSocket Server Riêng

Tạo file `ws-server.ts`:

```typescript
// ws-server.ts
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
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'https://hcmut-tutor.vercel.app',
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Socket.io authentication
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET || config.jwt.secret) as any;
    socket.data.userId = payload.userId;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Socket.io events
io.on('connection', (socket) => {
  const userId = socket.data.userId;
  console.log(`User connected: ${userId}`);

  socket.join(`user:${userId}`);

  socket.on('join-room', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('send-message', async (data) => {
    try {
      const { conversationId, content, type = 'text', fileUrl } = data;
      
      const conversation = await storage.findById<Conversation>('conversations.json', conversationId);
      if (!conversation || !conversation.participants.includes(userId)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      const receiverId = conversation.participants.find(id => id !== userId);
      if (!receiverId) return;

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

      await storage.create('messages.json', newMessage);
      await storage.update<Conversation>('conversations.json', conversationId, {
        updatedAt: now(),
        lastMessage: newMessage
      });

      io.to(`conversation:${conversationId}`).emit('new-message', newMessage);
      io.to(`user:${receiverId}`).emit('new-message', newMessage);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
```

### Bước 2: Deploy Lên Railway

1. **Tạo file `railway.json`:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "tsx ws-server.ts",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

2. **Tạo file `.env` trên Railway:**
```
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://hcmut-tutor.vercel.app
PORT=3001
```

3. **Deploy:**
   - Push code lên GitHub
   - Kết nối Railway với GitHub repo
   - Railway sẽ tự động deploy

### Bước 3: Cập Nhật Config

```typescript
// lib/config.ts
export const config = {
  // ...
  websocket: {
    url: process.env.WEBSOCKET_URL || 'wss://your-websocket-server.railway.app'
  },
  // ...
};
```

### Bước 4: Cập Nhật Frontend

```typescript
// src/lib/api.ts
import { io } from 'socket.io-client';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'wss://your-websocket-server.railway.app';

export const socket = io(WEBSOCKET_URL, {
  auth: {
    token: localStorage.getItem('token')
  },
  transports: ['websocket', 'polling']
});
```

---

## 🚀 Giải Pháp 2: Pusher (Dịch Vụ Bên Thứ Ba)

### Ưu điểm:
- ✅ Không cần maintain server
- ✅ Scalable
- ✅ Free tier available
- ✅ Dễ tích hợp

### Nhược điểm:
- ⚠️ Phụ thuộc vào dịch vụ bên thứ ba
- ⚠️ Có giới hạn trên free tier

### Cài đặt:

```bash
npm install pusher pusher-js
```

### Backend (Vercel Serverless Function):

```typescript
// api/pusher/message.ts
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
});

export default async function handler(req, res) {
  const { conversationId, message } = req.body;
  
  await pusher.trigger(`conversation-${conversationId}`, 'new-message', {
    message
  });
  
  res.json({ success: true });
}
```

### Frontend:

```typescript
import Pusher from 'pusher-js';

const pusher = new Pusher(process.env.VITE_PUSHER_KEY!, {
  cluster: process.env.VITE_PUSHER_CLUSTER!
});

const channel = pusher.subscribe(`conversation-${conversationId}`);
channel.bind('new-message', (data) => {
  console.log('New message:', data.message);
});
```

---

## 🚀 Giải Pháp 3: Long Polling (Tạm thời)

Nếu không muốn dùng dịch vụ bên thứ ba, có thể dùng Long Polling:

### Backend (Vercel Serverless Function):

```typescript
// api/messages/poll.ts
export default async function handler(req, res) {
  const { conversationId, lastMessageId } = req.query;
  
  // Poll for new messages
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds
  
  while (attempts < maxAttempts) {
    const messages = await getNewMessages(conversationId, lastMessageId);
    if (messages.length > 0) {
      return res.json({ messages });
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  return res.json({ messages: [] });
}
```

### Frontend:

```typescript
async function pollMessages() {
  const response = await fetch(`/api/messages/poll?conversationId=${id}&lastMessageId=${lastId}`);
  const { messages } = await response.json();
  if (messages.length > 0) {
    // Update UI
    pollMessages(); // Poll again
  }
}
```

**Nhược điểm:**
- ⚠️ Không thực sự real-time
- ⚠️ Tốn tài nguyên server
- ⚠️ Có độ trễ

---

## 📊 So Sánh Các Giải Pháp

| Giải pháp | Ưu điểm | Nhược điểm | Chi phí |
|-----------|---------|------------|---------|
| **Railway** | Full control, Real-time | Cần maintain server | $5/month |
| **Pusher** | Không cần server, Dễ dùng | Phụ thuộc bên thứ ba | Free tier available |
| **Long Polling** | Không cần server riêng | Không real-time, Tốn tài nguyên | Free |

---

## 🎯 Khuyến Nghị

**Cho production:** Dùng **Railway** (hoặc Render) để host WebSocket server riêng.

**Cho development:** Dùng **Long Polling** tạm thời hoặc **Pusher free tier**.

---

## 🔧 Cập Nhật Code

### 1. Tách WebSocket Server

Tạo file `ws-server.ts` riêng cho WebSocket server.

### 2. Cập Nhật server.ts

Xóa Socket.io code khỏi `server.ts`, chỉ giữ REST API.

### 3. Cập Nhật Frontend

Kết nối đến WebSocket server riêng thay vì cùng server.

### 4. Environment Variables

```bash
# Vercel
WEBSOCKET_URL=wss://your-websocket-server.railway.app

# Railway
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://hcmut-tutor.vercel.app
```

---

## 📝 Next Steps

1. ✅ Tạo `ws-server.ts` riêng
2. ✅ Xóa Socket.io code khỏi `server.ts`
3. ✅ Deploy WebSocket server lên Railway
4. ✅ Cập nhật frontend để kết nối đến WebSocket server
5. ✅ Test real-time messaging

