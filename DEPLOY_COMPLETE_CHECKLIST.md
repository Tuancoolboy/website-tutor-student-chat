# Checklist Hoàn Thành Deployment

## ✅ Đã Hoàn Thành

### 1. Vercel (Frontend + API)
- [x] Deploy Frontend + API lên Vercel
- [x] URL: `https://website-tutor-student-s8rl.vercel.app`
- [x] API: `https://website-tutor-student-s8rl.vercel.app/api`

### 2. Render (WebSocket Server)
- [x] Deploy WebSocket Server lên Render
- [x] URL: `https://website-tutor-student-1.onrender.com`

## 🔍 Bước 1: Test WebSocket Server

### 1.1. Test Health Endpoint

Mở terminal và chạy:
```bash
curl https://website-tutor-student-1.onrender.com/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "websocket-server",
  "timestamp": "..."
}
```

### 1.2. Kiểm Tra Logs trên Render

1. Vào Render Dashboard
2. Click vào service `website-tutor-student-1`
3. Click tab **"Logs"**
4. Kiểm tra xem có lỗi không
5. Kiểm tra xem server đã start thành công chưa

**Expected log:**
```
[Socket.io] Server initialized
[Socket.io] CORS origin: https://website-tutor-student-s8rl.vercel.app
WebSocket server listening on port 3001
```

## 🚀 Bước 2: Cập Nhật Frontend

### 2.1. Cập Nhật `src/env.ts`

Cập nhật WebSocket URL với URL Render thực tế:

```typescript
// src/env.ts
export const WEBSOCKET_URL = 
  getEnvVar('VITE_WEBSOCKET_URL') ||
  (isProduction
    ? 'https://website-tutor-student-1.onrender.com'  // URL Render của bạn
    : 'http://localhost:3001'
  );
```

### 2.2. Cập Nhật Environment Variables trên Vercel

1. Vào Vercel Dashboard
2. Chọn project: `website-tutor-student`
3. Vào **Settings** → **Environment Variables**
4. Thêm hoặc cập nhật:

#### Variable: VITE_WEBSOCKET_URL
- **Key:** `VITE_WEBSOCKET_URL`
- **Value:** `https://website-tutor-student-1.onrender.com`
- **Environment:** Production, Preview, Development

### 2.3. Deploy Lại Frontend

1. Push code lên GitHub (nếu đã sửa `src/env.ts`)
2. Vercel sẽ tự động deploy lại
3. Hoặc vào Vercel Dashboard → Deployments → Redeploy

## 🔍 Bước 3: Test Kết Nối

### 3.1. Test Frontend

1. Mở browser: `https://website-tutor-student-s8rl.vercel.app`
2. Mở Browser Console (F12)
3. Đăng nhập
4. Kiểm tra console logs:
   - ✅ WebSocket connected
   - ✅ User online
   - ❌ Không có lỗi CORS
   - ❌ Không có lỗi connection

### 3.2. Test Active Now

1. Mở 2 browser windows (hoặc 2 devices)
2. Đăng nhập với 2 tài khoản khác nhau
3. Kiểm tra "Active Now" section:
   - ✅ User thứ 2 hiển thị trong "Active Now" của user thứ 1
   - ✅ User thứ 1 hiển thị trong "Active Now" của user thứ 2

### 3.3. Test Messaging

1. Gửi message từ user 1 đến user 2
2. Kiểm tra:
   - ✅ Message được gửi thành công
   - ✅ Message hiển thị real-time
   - ✅ Online status cập nhật

## 🐛 Troubleshooting

### Lỗi: "WebSocket connection failed"

**Nguyên nhân:**
- CORS chưa được cấu hình đúng
- WebSocket server chưa start
- URL không đúng

**Giải pháp:**
1. Kiểm tra `FRONTEND_URL` trên Render:
   - Key: `FRONTEND_URL`
   - Value: `https://website-tutor-student-s8rl.vercel.app`
2. Kiểm tra logs trên Render
3. Kiểm tra WebSocket URL trong browser console

### Lỗi: "CORS error"

**Nguyên nhân:**
- `FRONTEND_URL` trên Render không đúng
- CORS chưa được cấu hình đúng

**Giải pháp:**
1. Kiểm tra `FRONTEND_URL` trên Render environment variables
2. Restart WebSocket server trên Render
3. Kiểm tra CORS settings trong `ws-server.ts`

### Lỗi: "Service sleep"

**Nguyên nhân:**
- Free tier tự động sleep sau 15 phút không có traffic

**Giải pháp:**
- Đây là bình thường với free tier
- Lần đầu truy cập sau khi sleep sẽ mất ~30 giây để wake up
- Upgrade lên Starter plan ($7/tháng) để tránh sleep

## ✅ Checklist Cuối Cùng

### WebSocket Server (Render):
- [ ] Health check thành công: ✅
- [ ] Logs không có lỗi: ✅
- [ ] Environment variables đã cấu hình: ✅
- [ ] `FRONTEND_URL` đúng: ✅

### Frontend (Vercel):
- [ ] `src/env.ts` đã cập nhật: ✅
- [ ] Environment variables trên Vercel đã cấu hình: ✅
- [ ] Frontend đã deploy lại: ✅
- [ ] Test WebSocket connection: ✅
- [ ] Test Active Now: ✅
- [ ] Test Messaging: ✅

## 🎯 URLs Cuối Cùng

### Production URLs:
- **Frontend:** `https://website-tutor-student-s8rl.vercel.app`
- **API:** `https://website-tutor-student-s8rl.vercel.app/api`
- **WebSocket:** `https://website-tutor-student-1.onrender.com`

### Environment Variables trên Vercel:
- `VITE_API_URL`: `https://website-tutor-student-s8rl.vercel.app/api`
- `VITE_WEBSOCKET_URL`: `https://website-tutor-student-1.onrender.com`

### Environment Variables trên Render:
- `PORT`: `3001`
- `NODE_ENV`: `production`
- `JWT_SECRET`: `[your-secret-key]`
- `FRONTEND_URL`: `https://website-tutor-student-s8rl.vercel.app`
- `API_URL`: `https://website-tutor-student-s8rl.vercel.app`

## 🎉 Hoàn Thành

Sau khi hoàn thành tất cả các bước trên:
- ✅ Frontend chạy trên Vercel
- ✅ API chạy trên Vercel
- ✅ WebSocket chạy trên Render
- ✅ Tất cả services đã kết nối
- ✅ Active Now hoạt động
- ✅ Messaging hoạt động real-time

## 📚 Tài Liệu Tham Khảo

- `HUONG_DAN_DEPLOY_VERCEL_WEBSOCKET_FIX.md` - Hướng dẫn chi tiết
- `RENDER_DEPLOY_CHECKLIST.md` - Checklist deploy Render
- `VERCEL_URL_CHOICE.md` - Hướng dẫn chọn URL Vercel

