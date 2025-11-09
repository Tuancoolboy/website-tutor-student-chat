# Checklist Testing Cuối Cùng

## ✅ Đã Hoàn Thành

- [x] WebSocket server đã deploy trên Render
- [x] Environment variable `VITE_WEBSOCKET_URL` đã thêm trên Vercel
- [x] Code đã cập nhật và push lên GitHub

## 🚀 Các Bước Tiếp Theo

### Bước 1: Đợi Vercel Redeploy

1. Vercel sẽ tự động redeploy khi có thay đổi environment variable
2. Đợi 2-3 phút
3. Kiểm tra status deployment trên Vercel Dashboard

**Hoặc Manual Redeploy:**
1. Vào Vercel Dashboard
2. Chọn project: `website-tutor-student`
3. Vào tab **"Deployments"**
4. Click **"..."** → **"Redeploy"**
5. Chọn environment: **Production**

### Bước 2: Test WebSocket Connection

1. Mở browser: `https://website-tutor-student-s8rl.vercel.app`
2. Mở Browser Console (F12)
3. Đăng nhập với tài khoản bất kỳ
4. Kiểm tra console logs:

**Expected logs:**
```
✅ WebSocket connected
✅ User online: [userId]
✅ Socket connected successfully
```

**Error logs (nếu có):**
```
❌ WebSocket connection failed
❌ CORS error
❌ Authentication failed
```

### Bước 3: Test Active Now

1. Mở **2 browser windows** (hoặc 2 devices):
   - Window 1: Đăng nhập với user A
   - Window 2: Đăng nhập với user B

2. Kiểm tra "Active Now" section:
   - ✅ User B hiển thị trong "Active Now" của user A
   - ✅ User A hiển thị trong "Active Now" của user B
   - ✅ Online status hiển thị đúng (green dot)

### Bước 4: Test Real-time Messaging

1. Trong Window 1 (User A):
   - Chọn conversation với User B
   - Gửi message: "Test message"

2. Trong Window 2 (User B):
   - Kiểm tra message hiển thị real-time
   - Kiểm tra notification (nếu có)

3. Trong Window 2 (User B):
   - Gửi reply: "Reply test"

4. Trong Window 1 (User A):
   - Kiểm tra reply hiển thị real-time

### Bước 5: Test Offline/Online Status

1. Trong Window 2 (User B):
   - Đóng browser hoặc disconnect

2. Trong Window 1 (User A):
   - Kiểm tra User B biến mất khỏi "Active Now"
   - Kiểm tra online status cập nhật

3. Trong Window 2 (User B):
   - Mở lại browser và đăng nhập

4. Trong Window 1 (User A):
   - Kiểm tra User B xuất hiện lại trong "Active Now"
   - Kiểm tra online status cập nhật

## 🐛 Troubleshooting

### Lỗi: "WebSocket connection failed"

**Kiểm tra:**
1. Environment variable `VITE_WEBSOCKET_URL` đã được thêm chưa
2. Value đúng: `https://website-tutor-student-1.onrender.com`
3. Vercel đã redeploy chưa
4. WebSocket server đang chạy: `curl https://website-tutor-student-1.onrender.com/health`

**Giải pháp:**
1. Kiểm tra environment variables trên Vercel
2. Manual redeploy trên Vercel
3. Kiểm tra Render logs
4. Clear browser cache và thử lại

### Lỗi: "CORS error"

**Kiểm tra:**
1. Render environment variable `FRONTEND_URL` đúng chưa
2. `FRONTEND_URL` = `https://website-tutor-student-s8rl.vercel.app`
3. Restart WebSocket server trên Render

**Giải pháp:**
1. Cập nhật `FRONTEND_URL` trên Render
2. Restart WebSocket server
3. Clear browser cache và thử lại

### Lỗi: "Authentication failed"

**Kiểm tra:**
1. JWT token có hợp lệ không
2. `JWT_SECRET` trên Render đúng chưa
3. User đã đăng nhập chưa

**Giải pháp:**
1. Đăng xuất và đăng nhập lại
2. Kiểm tra `JWT_SECRET` trên Render
3. Kiểm tra Render logs

### Lỗi: "Service sleep"

**Nguyên nhân:**
- Free tier tự động sleep sau 15 phút không có traffic

**Giải pháp:**
- Đây là bình thường với free tier
- Lần đầu truy cập sau khi sleep sẽ mất ~30 giây để wake up
- Upgrade lên Starter plan ($7/tháng) để tránh sleep

## ✅ Checklist Cuối Cùng

### Deployment:
- [x] WebSocket server deploy trên Render: ✅
- [x] Environment variable trên Vercel: ✅
- [ ] Vercel đã redeploy: ⏳
- [ ] Deployment thành công: ⏳

### Testing:
- [ ] WebSocket connection: ⏳
- [ ] Active Now hiển thị users: ⏳
- [ ] Real-time messaging: ⏳
- [ ] Online/Offline status: ⏳

### URLs:
- **Frontend:** `https://website-tutor-student-s8rl.vercel.app`
- **API:** `https://website-tutor-student-s8rl.vercel.app/api`
- **WebSocket:** `https://website-tutor-student-1.onrender.com`

## 🎉 Hoàn Thành

Sau khi hoàn thành tất cả các bước trên:
- ✅ WebSocket server chạy trên Render
- ✅ Frontend kết nối được với WebSocket
- ✅ Active Now hoạt động
- ✅ Real-time messaging hoạt động
- ✅ Online/Offline status hoạt động

## 📚 Tài Liệu Tham Khảo

- `NEXT_STEPS_AFTER_RENDER.md` - Hướng dẫn các bước tiếp theo
- `DEPLOY_COMPLETE_CHECKLIST.md` - Checklist hoàn chỉnh
- `VERCEL_ENV_VARIABLES_GUIDE.md` - Hướng dẫn environment variables

