# Giải Pháp WebSocket Miễn Phí

## ⚠️ Railway Pricing

**Railway:**
- ✅ Free trial: $5 credit (30 days)
- ⚠️ Sau khi hết trial: **Tính phí** (~$5-20/tháng)
- ⚠️ Không có free tier vĩnh viễn

## ✅ Giải Pháp Miễn Phí

### 1. **Render** (Khuyến nghị) ⭐

**Ưu điểm:**
- ✅ **FREE forever** cho WebSocket server
- ✅ Auto-deploy từ GitHub
- ✅ SSL certificate tự động
- ✅ Dễ setup

**Nhược điểm:**
- ⚠️ Server sleep sau 15 phút không dùng (free tier)
- ⚠️ Wake up mất ~30 giây

**Setup:**
1. Đăng ký tại [render.com](https://render.com)
2. Tạo "Web Service"
3. Connect GitHub repo
4. Cấu hình:
   - **Name:** `websocket-server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `tsx ws-server.ts`
   - **Plan:** Free

**Environment Variables:**
```
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://hcmut-tutor.vercel.app
PORT=10000
NODE_ENV=production
```

---

### 2. **Fly.io** (Miễn phí)

**Ưu điểm:**
- ✅ **FREE** cho 3 VMs nhỏ
- ✅ Không sleep
- ✅ Global edge network
- ✅ Dễ scale

**Nhược điểm:**
- ⚠️ Cần setup phức tạp hơn một chút

**Setup:**
```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Create app
fly launch

# 4. Deploy
fly deploy
```

---

### 3. **Pusher** (Free Tier) ⭐⭐

**Ưu điểm:**
- ✅ **FREE forever** (100 connections, 200k messages/day)
- ✅ Không cần maintain server
- ✅ Dễ tích hợp
- ✅ Reliable

**Nhược điểm:**
- ⚠️ Phụ thuộc vào dịch vụ bên thứ ba
- ⚠️ Có giới hạn trên free tier

**Setup:**

1. **Đăng ký tại [pusher.com](https://pusher.com)**

2. **Tạo app:**
   - Chọn "Channels" (real-time messaging)
   - Chọn cluster (Singapore gần VN nhất)
   - Copy credentials

3. **Cài đặt:**
   ```bash
   npm install pusher pusher-js
   ```

4. **Backend (Vercel Serverless Function):**
   
   ```typescript
   // api/pusher/trigger.ts
   import Pusher from 'pusher';
   
   const pusher = new Pusher({
     appId: process.env.PUSHER_APP_ID!,
     key: process.env.PUSHER_KEY!,
     secret: process.env.PUSHER_SECRET!,
     cluster: process.env.PUSHER_CLUSTER!,
     useTLS: true
   });
   
   export default async function handler(req, res) {
     const { channel, event, data } = req.body;
     
     await pusher.trigger(channel, event, data);
     
     res.json({ success: true });
   }
   ```

5. **Frontend:**
   
   ```typescript
   // src/hooks/usePusher.ts
   import { useEffect, useState } from 'react';
   import Pusher from 'pusher-js';
   
   export function usePusher() {
     const [pusher, setPusher] = useState<Pusher | null>(null);
     
     useEffect(() => {
       const pusherClient = new Pusher(import.meta.env.VITE_PUSHER_KEY!, {
         cluster: import.meta.env.VITE_PUSHER_CLUSTER!,
         authEndpoint: '/api/pusher/auth'
       });
       
       setPusher(pusherClient);
       
       return () => {
         pusherClient.disconnect();
       };
     }, []);
     
     return pusher;
   }
   ```

6. **Environment Variables:**
   
   **Vercel:**
   ```
   PUSHER_APP_ID=your-app-id
   PUSHER_KEY=your-key
   PUSHER_SECRET=your-secret
   PUSHER_CLUSTER=ap1
   ```
   
   **Frontend:**
   ```
   VITE_PUSHER_KEY=your-key
   VITE_PUSHER_CLUSTER=ap1
   ```

---

### 4. **Supabase Realtime** (Free Tier)

**Ưu điểm:**
- ✅ **FREE** (500MB database, 2GB bandwidth)
- ✅ Built-in real-time
- ✅ PostgreSQL database
- ✅ Auth included

**Nhược điểm:**
- ⚠️ Cần migrate data sang Supabase
- ⚠️ Phụ thuộc vào Supabase

---

### 5. **Long Polling** (Hoàn toàn miễn phí)

**Ưu điểm:**
- ✅ **FREE** (chạy trên Vercel)
- ✅ Không cần server riêng
- ✅ Đơn giản

**Nhược điểm:**
- ⚠️ Không thực sự real-time (có độ trễ)
- ⚠️ Tốn tài nguyên hơn

**Implementation:**

```typescript
// api/messages/poll.ts
export default async function handler(req, res) {
  const { conversationId, lastMessageId } = req.query;
  
  // Set timeout for long polling (30 seconds)
  res.setTimeout(30000);
  
  let attempts = 0;
  const maxAttempts = 30;
  
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

---

## 📊 So Sánh

| Giải pháp | Chi phí | Real-time | Độ khó | Khuyến nghị |
|-----------|---------|-----------|--------|-------------|
| **Render** | FREE | ✅ | Dễ | ⭐⭐⭐ |
| **Fly.io** | FREE | ✅ | Trung bình | ⭐⭐ |
| **Pusher** | FREE | ✅ | Dễ | ⭐⭐⭐⭐ |
| **Long Polling** | FREE | ⚠️ | Dễ | ⭐⭐ |
| **Railway** | $5+/tháng | ✅ | Dễ | ❌ (tính phí) |

---

## 🎯 Khuyến Nghị

### Cho Production (Miễn phí):

1. **Pusher** (Nếu không muốn maintain server)
   - Free tier đủ cho small/medium app
   - Dễ tích hợp
   - Reliable

2. **Render** (Nếu muốn control server)
   - Free forever
   - Server sleep nhưng auto wake
   - Dễ deploy

### Cho Development:

- **Long Polling** (Tạm thời)
- Hoặc **Render** (Free)

---

## 🚀 Hướng Dẫn Chuyển Sang Render

### Bước 1: Tạo Render Account

1. Đăng ký tại [render.com](https://render.com)
2. Verify email

### Bước 2: Tạo Web Service

1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Chọn repo của bạn

### Bước 3: Cấu Hình

```
Name: websocket-server
Environment: Node
Region: Singapore (gần VN nhất)
Branch: main
Root Directory: / (root)
Build Command: npm install
Start Command: tsx ws-server.ts
Plan: Free
```

### Bước 4: Environment Variables

```
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://hcmut-tutor.vercel.app
PORT=10000
NODE_ENV=production
```

### Bước 5: Deploy

1. Click "Create Web Service"
2. Render sẽ tự động build và deploy
3. Lấy URL (ví dụ: `https://websocket-server.onrender.com`)

### Bước 6: Cập Nhật Config

**Vercel Environment Variables:**
```
WEBSOCKET_URL=wss://websocket-server.onrender.com
```

**Frontend (.env):**
```
VITE_WEBSOCKET_URL=wss://websocket-server.onrender.com
```

---

## 🔧 Hướng Dẫn Chuyển Sang Pusher

Xem file `PUSHER_SETUP.md` (sẽ tạo sau)

---

## 📝 Next Steps

1. ✅ Chọn giải pháp (Render hoặc Pusher)
2. ✅ Setup và deploy
3. ✅ Test real-time messaging
4. ✅ Update frontend

---

## 💡 Lưu Ý

- **Render:** Server sleep sau 15 phút, wake up mất ~30s (free tier)
- **Pusher:** Free tier đủ cho 100 connections, 200k messages/day
- **Long Polling:** Có độ trễ nhưng hoàn toàn miễn phí

Bạn muốn tôi setup giải pháp nào?

