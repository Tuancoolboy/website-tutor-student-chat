# Các Bước Tiếp Theo Sau Khi Deploy Render

## ✅ Đã Hoàn Thành

### 1. WebSocket Server trên Render
- ✅ URL: `https://website-tutor-student-1.onrender.com`
- ✅ Health check: ✅ Đã test thành công
- ✅ Server đang chạy: ✅

### 2. Code đã cập nhật
- ✅ `src/env.ts` - Đã cập nhật WebSocket URL

## 🚀 Các Bước Tiếp Theo

### Bước 1: Thêm Environment Variable trên Vercel

1. Vào Vercel Dashboard: https://vercel.com
2. Chọn project: `website-tutor-student`
3. Vào **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Thêm variable:

**Variable 1: VITE_WEBSOCKET_URL**
- **Key:** `VITE_WEBSOCKET_URL`
- **Value:** `https://website-tutor-student-1.onrender.com`
- **Environment:** Production, Preview, Development
- Click **"Save"**

### Bước 2: Deploy Lại Frontend

**Option 1: Push code lên GitHub (Khuyến nghị)**
```bash
git add .
git commit -m "Update WebSocket URL to Render"
git push
```
Vercel sẽ tự động deploy lại.

**Option 2: Redeploy trên Vercel**
1. Vào Vercel Dashboard
2. Chọn project
3. Vào tab **"Deployments"**
4. Click **"..."** → **"Redeploy"**

### Bước 3: Test Kết Nối

1. Mở browser: `https://website-tutor-student-s8rl.vercel.app`
2. Mở Browser Console (F12)
3. Đăng nhập
4. Kiểm tra console logs:
   - ✅ WebSocket connected
   - ✅ User online
   - ❌ Không có lỗi CORS
   - ❌ Không có lỗi connection

### Bước 4: Test Active Now

1. Mở 2 browser windows (hoặc 2 devices)
2. Đăng nhập với 2 tài khoản khác nhau
3. Kiểm tra "Active Now" section:
   - ✅ User thứ 2 hiển thị trong "Active Now" của user thứ 1
   - ✅ User thứ 1 hiển thị trong "Active Now" của user thứ 2

## 🔍 Kiểm Tra Render Environment Variables

Đảm bảo trên Render đã cấu hình:

### Environment Variables trên Render:

1. **PORT:**
   - Key: `PORT`
   - Value: `3001`

2. **NODE_ENV:**
   - Key: `NODE_ENV`
   - Value: `production`

3. **JWT_SECRET:**
   - Key: `JWT_SECRET`
   - Value: `[your-secret-key]`

4. **FRONTEND_URL:**
   - Key: `FRONTEND_URL`
   - Value: `https://website-tutor-student-s8rl.vercel.app`

5. **API_URL:**
   - Key: `API_URL`
   - Value: `https://website-tutor-student-s8rl.vercel.app`

## 📋 Checklist

### Render (WebSocket Server):
- [x] Deploy thành công
- [x] Health check: ✅
- [x] Environment variables đã cấu hình
- [ ] `FRONTEND_URL` đúng: `https://website-tutor-student-s8rl.vercel.app`

### Vercel (Frontend):
- [ ] Environment variable `VITE_WEBSOCKET_URL` đã thêm
- [ ] Frontend đã deploy lại
- [ ] Test WebSocket connection: ✅
- [ ] Test Active Now: ✅

## 🐛 Troubleshooting

### Lỗi: "WebSocket connection failed"

**Kiểm tra:**
1. Render environment variable `FRONTEND_URL` đúng chưa
2. Vercel environment variable `VITE_WEBSOCKET_URL` đã thêm chưa
3. WebSocket server đang chạy (test health endpoint)

### Lỗi: "CORS error"

**Kiểm tra:**
1. `FRONTEND_URL` trên Render = `https://website-tutor-student-s8rl.vercel.app`
2. Restart WebSocket server trên Render
3. Clear browser cache và thử lại

## 🎯 URLs Cuối Cùng

### Production:
- **Frontend:** `https://website-tutor-student-s8rl.vercel.app`
- **API:** `https://website-tutor-student-s8rl.vercel.app/api`
- **WebSocket:** `https://website-tutor-student-1.onrender.com`

## ✅ Hoàn Thành

Sau khi hoàn thành các bước trên:
- ✅ WebSocket server chạy trên Render
- ✅ Frontend kết nối được với WebSocket
- ✅ Active Now hoạt động
- ✅ Real-time messaging hoạt động

