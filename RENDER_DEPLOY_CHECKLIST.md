# Render Deploy Checklist - Quick Guide

## 🚀 Quick Steps

### Service 1: API Server

- [ ] **Tạo Service:**
  - Click "Web Services" → "New Web Service →"
  - Connect GitHub repository: `Website-tutor-student`

- [ ] **Cấu Hình:**
  - Name: `tutor-api`
  - Region: Chọn region gần nhất
  - Branch: `main`
  - Root Directory: `/` (để trống)
  - Runtime: `Node`
  - **Build Command:** `npm install` (hoặc để TRỐNG nếu Render cho phép)
  - **Lưu ý:** KHÔNG dùng `npm run build` (sẽ build frontend và gây lỗi)
  - **Start Command:** `npm run api` ⚠️ QUAN TRỌNG
  - Instance Type: `Free` (hoặc `Starter` $7/tháng)

- [ ] **Environment Variables:**
  - Click "Add Environment Variable" → Thêm từng biến:
    - **Key:** `PORT` | **Value:** `3000`
    - **Key:** `NODE_ENV` | **Value:** `production`
    - **Key:** `JWT_SECRET` | **Value:** `your-secret-key-here` (tạo chuỗi ngẫu nhiên mạnh)
    - **Key:** `FRONTEND_URL` | **Value:** `https://website-tutor-student-s8rl.vercel.app` (Production URL - KHÔNG dùng Preview URL)

- [ ] **Deploy:**
  - Click "Create Web Service"
  - Đợi deploy hoàn thành (3-5 phút)

- [ ] **Lấy Domain:**
  - Copy domain: `https://tutor-api.onrender.com`
  - Test: `curl https://tutor-api.onrender.com/health`

### Service 2: WebSocket Server

- [ ] **Tạo Service:**
  - Click "+ New" → "Web Service"
  - Connect cùng repository: `Website-tutor-student`

- [ ] **Cấu Hình:**
  - Name: `tutor-websocket`
  - Region: Cùng region với API Server
  - Branch: `main`
  - Root Directory: `/` (để trống)
  - Runtime: `Node`
  - **Build Command:** `npm install` (hoặc để TRỐNG nếu Render cho phép)
  - **Lưu ý:** KHÔNG dùng `npm run build` (sẽ build frontend và gây lỗi)
  - **Start Command:** `npm run ws` ⚠️ QUAN TRỌNG
  - Instance Type: `Free` (hoặc `Starter` $7/tháng)

- [ ] **Environment Variables:**
  - Click "Add Environment Variable" → Thêm từng biến:
    - **Key:** `PORT` | **Value:** `3001`
    - **Key:** `NODE_ENV` | **Value:** `production`
    - **Key:** `JWT_SECRET` | **Value:** `your-secret-key-here` (CÙNG giá trị với API Server)
    - **Key:** `FRONTEND_URL` | **Value:** `https://website-tutor-student-s8rl.vercel.app` (Production URL - KHÔNG dùng Preview URL)
    - **Key:** `API_URL` | **Value:** `https://website-tutor-student-s8rl.vercel.app` (Production URL - cùng domain với Frontend)

- [ ] **Deploy:**
  - Click "Create Web Service"
  - Đợi deploy hoàn thành (3-5 phút)

- [ ] **Lấy Domain:**
  - Copy domain: `https://tutor-websocket.onrender.com`
  - Test: `curl https://tutor-websocket.onrender.com/health`

## ✅ Verification

- [ ] API Server health check: ✅
- [ ] WebSocket Server health check: ✅
- [ ] Logs không có lỗi: ✅
- [ ] Environment variables đã cấu hình: ✅

## 📝 Information to Save

```
API Server URL: https://tutor-api.onrender.com
API Base URL: https://tutor-api.onrender.com/api

WebSocket Server URL: https://tutor-websocket.onrender.com

JWT_SECRET: [your-secret-key]

Frontend URL: https://website-tutor-student-s8rl.vercel.app (Production)
```

## 🎯 Next: Update Frontend

Sau khi deploy xong, cập nhật frontend:
1. Cập nhật `src/env.ts` với Render URLs
2. Thêm environment variables trên Vercel
3. Deploy frontend lên Vercel

## 🐛 Common Issues

- **Build failed:** Kiểm tra Start Command (`npm run api` / `npm run ws`)
- **Service sleep:** Free tier tự động sleep sau 15 phút (bình thường)
- **Slow first request:** Service đang wake up (~30 giây) - bình thường với free tier
- **CORS error:** Kiểm tra `FRONTEND_URL` environment variable
- **JWT error:** Đảm bảo cả 2 servers dùng CÙNG `JWT_SECRET`

## 💡 Free Tier Notes

- ✅ **Miễn phí hoàn toàn** cho development/testing
- ⚠️ **Tự động sleep** sau 15 phút không có traffic
- ⚠️ **Lần đầu truy cập** sau khi sleep mất ~30 giây để wake up
- ✅ **Đủ dùng** cho development và testing
- 💵 **Production:** Nên upgrade lên Starter plan ($7/tháng) để tránh sleep

## 📚 Full Guide

Xem file `HUONG_DAN_DEPLOY_RENDER_CHI_TIET.md` để biết chi tiết từng bước.

