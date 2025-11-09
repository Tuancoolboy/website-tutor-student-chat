# Hướng Dẫn Deploy WebSocket Server

## ⚠️ Vấn Đề

**Vercel Serverless Functions KHÔNG hỗ trợ WebSocket.**

Socket.io cần persistent connections, không tương thích với serverless.

## ✅ Giải Pháp

**Tách WebSocket server riêng** và deploy lên Railway, Render, hoặc platform tương tự.

## 🚀 Deploy Lên Railway

### Bước 1: Tạo Railway Account

1. Đăng ký tại [railway.app](https://railway.app)
2. Đăng nhập với GitHub

### Bước 2: Tạo New Project

1. Click "New Project"
2. Chọn "Deploy from GitHub repo"
3. Chọn repository của bạn

### Bước 3: Cấu Hình

1. **Service Name:** `websocket-server`
2. **Root Directory:** `/` (root của repo)
3. **Start Command:** `tsx ws-server.ts`
4. **Build Command:** `npm install`

### Bước 4: Environment Variables

Thêm các biến môi trường sau:

```
JWT_SECRET=your-jwt-secret (giống với Vercel)
FRONTEND_URL=https://hcmut-tutor.vercel.app
PORT=3001
NODE_ENV=production
```

### Bước 5: Deploy

1. Railway sẽ tự động deploy khi bạn push code
2. Sau khi deploy xong, lấy URL (ví dụ: `https://your-app.railway.app`)

### Bước 6: Cập Nhật Config

1. **Vercel Environment Variables:**
   ```
   WEBSOCKET_URL=wss://your-app.railway.app
   ```

2. **Frontend Environment Variables:**
   ```env
   VITE_WEBSOCKET_URL=wss://your-app.railway.app
   ```

## 🔧 Cập Nhật Frontend

### 1. Tạo WebSocket Hook

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001';

export function useWebSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const newSocket = io(WEBSOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  return { socket, connected };
}
```

### 2. Sử Dụng trong Component

```typescript
// src/pages/tutor/Messages.tsx
import { useWebSocket } from '../../hooks/useWebSocket';

const Messages = () => {
  const token = localStorage.getItem('token');
  const { socket, connected } = useWebSocket(token);

  useEffect(() => {
    if (!socket) return;

    // Join conversation room
    socket.emit('join-room', conversationId);

    // Listen for new messages
    socket.on('new-message', (message) => {
      // Update UI
      console.log('New message:', message);
    });

    return () => {
      socket.emit('leave-room', conversationId);
      socket.off('new-message');
    };
  }, [socket, conversationId]);

  // Send message
  const sendMessage = (content: string) => {
    if (!socket || !connected) {
      // Fallback to REST API
      return fetch('/api/conversations/' + conversationId + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
    }

    socket.emit('send-message', {
      conversationId,
      content
    });
  };
};
```

## 📊 Kiến Trúc

```
┌─────────────────────────────────────┐
│  VERCEL                             │
│  https://hcmut-tutor.vercel.app    │
│  ├── Frontend (React)               │
│  └── REST API (Serverless)          │
└──────────────┬──────────────────────┘
               │
               │ HTTP Requests
               │ WebSocket Connection
               │
┌──────────────▼──────────────────────┐
│  RAILWAY                            │
│  wss://your-app.railway.app        │
│  └── WebSocket Server (Socket.io)  │
└─────────────────────────────────────┘
```

## 🧪 Test Local

1. **Start REST API server:**
   ```bash
   npm run api
   ```

2. **Start WebSocket server:**
   ```bash
   tsx ws-server.ts
   ```

3. **Start Frontend:**
   ```bash
   npm run dev
   ```

## 📝 Checklist

- [ ] Tạo Railway account
- [ ] Deploy WebSocket server lên Railway
- [ ] Cập nhật environment variables
- [ ] Cập nhật frontend để kết nối WebSocket
- [ ] Test real-time messaging
- [ ] Test fallback to REST API khi WebSocket không available

## 🔗 Links

- [Railway](https://railway.app)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Vercel Deployment](https://vercel.com/docs)

