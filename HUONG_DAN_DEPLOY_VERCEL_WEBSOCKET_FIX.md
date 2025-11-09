# Hướng Dẫn Chi Tiết: Deploy Vercel + WebSocket Fix

## 🚨 Vấn Đề

**Vercel báo lỗi WebSocket khi deploy:**
- ❌ WebSocket không thể chạy trên Vercel Serverless Functions
- ❌ Vercel không hỗ trợ persistent connections
- ❌ Socket.io cần connection liên tục

## ✅ Giải Pháp

**Tách thành 2 phần:**
1. **Frontend + API** → Deploy trên Vercel
2. **WebSocket Server** → Deploy riêng trên Render/Railway

## 📋 Kiến Trúc

```
┌─────────────────────────────────────────┐
│         VERCEL (Frontend + API)         │
│  https://your-app.vercel.app            │
│  ├── Frontend (React)                   │
│  └── API (Serverless Functions)         │
│      └── api/index.ts → server.ts       │
│          ├── /api/users                 │
│          ├── /api/conversations         │
│          ├── /api/messages              │
│          └── /api/* (tất cả routes)     │
└──────────────┬──────────────────────────┘
               │
               │ WebSocket Connection
               │
┌──────────────▼──────────────────────────┐
│    RENDER (WebSocket Server)            │
│  https://ws-app.onrender.com            │
│  └── ws-server.ts                       │
│      └── Socket.io                      │
│          └── Active Now                 │
└─────────────────────────────────────────┘
```

## 🚀 Bước 1: Chuẩn Bị Code

### 1.1. Kiểm Tra Files

Đảm bảo các files sau tồn tại:
- ✅ `api/index.ts` - Vercel serverless function handler
- ✅ `server.ts` - Express API server
- ✅ `ws-server.ts` - WebSocket server (sẽ deploy riêng)
- ✅ `vercel.json` - Vercel configuration
- ✅ `src/env.ts` - Environment configuration

### 1.2. Kiểm Tra `api/index.ts`

File này phải export Express app:
```typescript
// api/index.ts
import app from '../server.js';
export default app;
```

### 1.3. Kiểm Tra `server.ts`

File này phải **KHÔNG** gọi `app.listen()` khi chạy trên Vercel:
```typescript
// server.ts
// Chỉ start server nếu không phải Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, ...);
}
```

### 1.4. Kiểm Tra `vercel.json`

File này phải cấu hình đúng:
```json
{
  "functions": {
    "api/index.ts": {
      "memory": 2048,
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    }
  ]
}
```

## 🚀 Bước 2: Deploy Frontend + API Lên Vercel

### 2.1. Push Code Lên GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 2.2. Connect Vercel với GitHub

1. Vào https://vercel.com
2. Đăng nhập bằng GitHub
3. Click **"Add New Project"**
4. Chọn repository: `Website-tutor-student`
5. Click **"Import"**

### 2.3. Cấu Hình Project trên Vercel

1. **Project Name:** `website-tutor-student` (hoặc tên bạn muốn)

2. **Framework Preset:**
   - Chọn: **"Vite"** (tự động detect)

3. **Root Directory:**
   - Để trống (hoặc `/`)

4. **Build Command:**
   - Để mặc định: `npm run build`

5. **Output Directory:**
   - Để mặc định: `dist`

6. **Install Command:**
   - Để mặc định: `npm install`

7. **Environment Variables:**
   - Thêm các biến sau (nếu cần):
     - `VITE_API_URL` - Sẽ cập nhật sau khi có Render URL
     - `VITE_WEBSOCKET_URL` - Sẽ cập nhật sau khi có Render URL

### 2.4. Deploy

1. Click **"Deploy"**
2. Đợi deploy hoàn thành (3-5 phút)
3. Vercel sẽ tự động cung cấp domain: `https://website-tutor-student.vercel.app`

### 2.5. Test API

1. Test health endpoint:
   ```bash
   curl https://website-tutor-student.vercel.app/api/health
   ```

2. Expected response:
   ```json
   {
     "success": true,
     "message": "Server is running",
     "timestamp": "..."
   }
   ```

3. Nếu thấy response này → ✅ API đã chạy thành công trên Vercel!

## 🚀 Bước 3: Deploy WebSocket Server Lên Render

### 3.1. Tạo Web Service trên Render

1. Vào https://render.com
2. Đăng nhập bằng GitHub
3. Click **"+ New"** → **"Web Service"**
4. Connect repository: `Website-tutor-student`
5. Click vào repository

### 3.2. Cấu Hình Service

#### Basic Settings:

1. **Name:**
   - Nhập: `tutor-websocket`

2. **Region:**
   - Chọn region gần nhất (ví dụ: `Singapore`)

3. **Branch:**
   - Chọn: `main`

4. **Root Directory:**
   - Để trống

5. **Runtime:**
   - Chọn: `Node`

6. **Build Command:**
   - Nhập: `npm install` (hoặc để TRỐNG nếu Render cho phép)
   - **Lưu ý:** KHÔNG dùng `npm run build` (sẽ build frontend và gây lỗi)

7. **Start Command:**
   - Nhập: `npm run ws` ⚠️ QUAN TRỌNG

8. **Instance Type:**
   - Chọn: **"Free"** (miễn phí)

#### Environment Variables:

Click **"Add Environment Variable"** và thêm:

1. **PORT:**
   - Key: `PORT`
   - Value: `3001`

2. **NODE_ENV:**
   - Key: `NODE_ENV`
   - Value: `production`

3. **JWT_SECRET:**
   - Key: `JWT_SECRET`
   - Value: Tạo secret key mạnh (ví dụ: `tutor-support-system-secret-key-2025-production`)
   - **Lưu ý:** Phải **CÙNG** với JWT_SECRET của API server (nếu có)

4. **FRONTEND_URL:**
   - Key: `FRONTEND_URL`
   - Value: `https://website-tutor-student-s8rl.vercel.app` (URL Vercel Production - KHÔNG dùng Preview URL)

5. **API_URL:**
   - Key: `API_URL`
   - Value: `https://website-tutor-student-s8rl.vercel.app` (URL Vercel Production - cùng domain với Frontend)

### 3.3. Deploy

1. Click **"Create Web Service"**
2. Đợi deploy hoàn thành (3-5 phút)
3. Render sẽ tự động cung cấp domain: `https://tutor-websocket.onrender.com`

### 3.4. Test WebSocket Server

1. Test health endpoint:
   ```bash
   curl https://tutor-websocket.onrender.com/health
   ```

2. Expected response:
   ```json
   {
     "status": "ok",
     "service": "websocket-server",
     "timestamp": "..."
   }
   ```

3. Nếu thấy response này → ✅ WebSocket Server đã chạy thành công!

## 🚀 Bước 4: Cập Nhật Frontend

### 4.1. Cập Nhật `src/env.ts`

Cập nhật file `src/env.ts` với URLs thực tế:

```typescript
// src/env.ts
const isProduction = typeof window !== 'undefined' 
  ? window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  : false;

// API Base URL - Vercel (cùng domain với frontend)
export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  (isProduction 
    ? 'https://website-tutor-student.vercel.app/api'  // URL Vercel của bạn
    : 'http://localhost:3000/api'
  );

// WebSocket URL - Render
export const WEBSOCKET_URL = 
  import.meta.env.VITE_WEBSOCKET_URL ||
  (isProduction
    ? 'https://tutor-websocket.onrender.com'  // URL Render của bạn
    : 'http://localhost:3001'
  );
```

### 4.2. Cập Nhật Environment Variables trên Vercel

1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Thêm các biến sau:

#### Variable 1: VITE_API_URL
- **Key:** `VITE_API_URL`
- **Value:** `https://website-tutor-student-s8rl.vercel.app/api` (Production URL)
- **Environment:** Production, Preview, Development
- **Lưu ý:** Dùng Production URL (không dùng Preview URL)

#### Variable 2: VITE_WEBSOCKET_URL
- **Key:** `VITE_WEBSOCKET_URL`
- **Value:** `https://tutor-websocket.onrender.com`
- **Environment:** Production, Preview, Development

### 4.3. Deploy Lại Frontend

1. Push code lên GitHub:
   ```bash
   git add .
   git commit -m "Update API and WebSocket URLs"
   git push
   ```

2. Vercel sẽ tự động deploy lại
3. Đợi deploy hoàn thành

## 🚀 Bước 5: Cập Nhật CORS trên Render

### 5.1. Kiểm Tra CORS trong `ws-server.ts`

Đảm bảo CORS đã được cấu hình đúng:

```typescript
// ws-server.ts
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || config.frontend.url || '*',
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});
```

### 5.2. Kiểm Tra CORS trong `server.ts`

Đảm bảo CORS đã được cấu hình đúng:

```typescript
// server.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '*' : config.frontend.url),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## ✅ Bước 6: Test

### 6.1. Test API trên Vercel

```bash
# Test health endpoint
curl https://website-tutor-student.vercel.app/api/health

# Test API endpoint
curl https://website-tutor-student.vercel.app/api/users
```

### 6.2. Test WebSocket trên Render

```bash
# Test health endpoint
curl https://tutor-websocket.onrender.com/health
```

### 6.3. Test Frontend

1. Mở browser: `https://website-tutor-student.vercel.app`
2. Mở Browser Console (F12)
3. Kiểm tra:
   - ✅ API calls thành công
   - ✅ WebSocket connection thành công
   - ✅ Login/Register hoạt động
   - ✅ Messaging hoạt động
   - ✅ Active Now hoạt động

## 🐛 Troubleshooting

### Lỗi: "WebSocket connection failed"

**Nguyên nhân:**
- WebSocket server chưa deploy
- CORS chưa được cấu hình đúng
- URL không đúng

**Giải pháp:**
1. Kiểm tra WebSocket server đang chạy trên Render
2. Kiểm tra `WEBSOCKET_URL` trong `src/env.ts`
3. Kiểm tra CORS settings trong `ws-server.ts`
4. Kiểm tra `FRONTEND_URL` trong Render environment variables

### Lỗi: "API calls failed"

**Nguyên nhân:**
- API server chưa deploy trên Vercel
- URL không đúng
- CORS chưa được cấu hình

**Giải pháp:**
1. Kiểm tra API endpoint: `https://your-app.vercel.app/api/health`
2. Kiểm tra `API_BASE_URL` trong `src/env.ts`
3. Kiểm tra CORS settings trong `server.ts`
4. Kiểm tra logs trên Vercel dashboard

### Lỗi: "CORS error"

**Nguyên nhân:**
- `FRONTEND_URL` không đúng
- CORS chưa được cấu hình đúng

**Giải pháp:**
1. Kiểm tra `FRONTEND_URL` trong Render environment variables
2. Đảm bảo `FRONTEND_URL` khớp với Vercel domain
3. Kiểm tra CORS settings trong `server.ts` và `ws-server.ts`
4. Restart services sau khi thay đổi

### Lỗi: "JWT token invalid"

**Nguyên nhân:**
- `JWT_SECRET` không khớp giữa Vercel và Render

**Giải pháp:**
1. Đảm bảo `JWT_SECRET` giống nhau ở cả 2 nơi
2. Kiểm tra environment variables
3. Restart services sau khi thay đổi

### Lỗi: "Build failed on Vercel"

**Nguyên nhân:**
- TypeScript errors
- Build command sai
- Dependencies thiếu

**Giải pháp:**
1. Kiểm tra logs trên Vercel dashboard
2. Kiểm tra TypeScript errors
3. Kiểm tra `package.json` có đủ dependencies
4. Kiểm tra build command trong Vercel settings

## 📋 Checklist Cuối Cùng

### Vercel (Frontend + API):
- [ ] Frontend đã deploy thành công
- [ ] API đã deploy thành công
- [ ] Test API endpoint: ✅
- [ ] Environment variables đã cấu hình
- [ ] CORS đã được cấu hình đúng

### Render (WebSocket):
- [ ] WebSocket server đã deploy thành công
- [ ] Test health endpoint: ✅
- [ ] Environment variables đã cấu hình
- [ ] CORS đã được cấu hình đúng
- [ ] `FRONTEND_URL` đúng với Vercel domain

### Frontend:
- [ ] `src/env.ts` đã được cập nhật
- [ ] Environment variables trên Vercel đã được thêm
- [ ] Test API calls: ✅
- [ ] Test WebSocket connection: ✅
- [ ] Test login/register: ✅
- [ ] Test messaging: ✅
- [ ] Test Active Now: ✅

## 🎯 Tóm Tắt

### Đã Làm:
1. ✅ Deploy Frontend + API lên Vercel
2. ✅ Deploy WebSocket Server lên Render
3. ✅ Cập nhật URLs trong frontend
4. ✅ Cấu hình CORS
5. ✅ Test tất cả tính năng

### Kết Quả:
- ✅ API chạy trên Vercel (miễn phí)
- ✅ WebSocket chạy trên Render (miễn phí)
- ✅ Frontend chạy trên Vercel (miễn phí)
- ✅ Tổng chi phí: $0 (free tier)

### URLs:
- **Frontend:** `https://website-tutor-student-s8rl.vercel.app` (Production)
- **API:** `https://website-tutor-student-s8rl.vercel.app/api` (Production)
- **WebSocket:** `https://tutor-websocket.onrender.com` (Render - cập nhật sau khi deploy)

## 📚 Tài Liệu Tham Khảo

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [WebSocket và Vercel](https://vercel.com/docs/concepts/functions/serverless-functions#websocket-support)
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## ✅ Hoàn Thành

Sau khi hoàn thành tất cả các bước trên, bạn đã:
- ✅ Fix lỗi WebSocket trên Vercel
- ✅ Deploy API + Frontend lên Vercel
- ✅ Deploy WebSocket lên Render
- ✅ Cấu hình đầy đủ
- ✅ Test tất cả tính năng

**Project của bạn đã sẵn sàng production!** 🎉

