# Hướng Dẫn Chạy Ứng Dụng

## 📋 Yêu Cầu Hệ Thống

- Node.js >= 18.x
- npm hoặc yarn
- Git (để clone project)

## 🚀 Cách Chạy

### Bước 1: Cài Đặt Dependencies

```bash
npm install
```

### Bước 2: Khởi Động API Server

Mở terminal thứ nhất:

```bash
npm run api
```

API server sẽ chạy tại: `http://localhost:3000`

Bạn sẽ thấy thông báo:
```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           🎓 Tutor Support System API Server                ║
║                                                              ║
║  Status: ✅ Running                                          ║
║  Port: 3000                                                  ║
║  Environment: development                                    ║
║                                                              ║
║  API Base: http://localhost:3000/api                        ║
║  Health Check: http://localhost:3000/health                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### Bước 3: Khởi Động Frontend

Mở terminal thứ hai (giữ terminal API server đang chạy):

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

Bạn sẽ thấy thông báo:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## 🌐 Truy Cập Ứng Dụng

1. Mở trình duyệt và truy cập: `http://localhost:5173`
2. Đăng nhập hoặc đăng ký tài khoản mới

## 📝 Các Scripts Khác

### Chạy API với Auto-reload (Development)
```bash
npm run dev:api
```

### Build Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Test API
```bash
npm run test:api
```

### Test Messaging System
```bash
npm run test:messages
```

### Seed Database (Tạo dữ liệu mẫu)
```bash
npm run seed
```

### Clean và Seed lại
```bash
npm run seed:clean
```

## 🔧 Cấu Hình Môi Trường

### Tạo file `.env` (nếu cần)

```env
# API Configuration
PORT=3000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-secret-key-here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# WebSocket URL (nếu dùng WebSocket)
WEBSOCKET_URL=ws://localhost:3001
```

## 🐛 Troubleshooting

### Lỗi: Port đã được sử dụng

**API Server (Port 3000):**
```bash
# Tìm process đang dùng port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

**Frontend (Port 5173):**
```bash
# Tìm process đang dùng port 5173
lsof -ti:5173

# Kill process
kill -9 $(lsof -ti:5173)
```

### Lỗi: Module not found

```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi: API không kết nối được

1. Kiểm tra API server đang chạy: `http://localhost:3000/health`
2. Kiểm tra CORS settings trong `server.ts`
3. Kiểm tra `API_BASE_URL` trong `src/env.ts`

### Lỗi: Database/Storage

```bash
# Xóa data cũ và seed lại
npm run seed:clean
```

## 📱 Test với 2 Users

### User 1 - Student:
1. Đăng ký/Login: `student@test.com` / `password123`
2. Vào `/student/messages`

### User 2 - Tutor:
1. Đăng ký/Login: `tutor@test.com` / `password123`
2. Vào `/tutor/messages`

### Test Real-time Messaging:
1. Mở 2 tab trình duyệt (hoặc 2 trình duyệt khác nhau)
2. Login 2 users khác nhau
3. Tạo conversation và gửi messages
4. Messages sẽ hiển thị real-time qua Long Polling

## 🎯 Các Tính Năng Chính

### ✅ Đã Hoàn Thành:
- ✅ Authentication (Login/Register)
- ✅ User Management
- ✅ Session Management
- ✅ Forum (Tạo/Xem bài viết)
- ✅ Real-time Messaging (Long Polling)
- ✅ Digital Library
- ✅ Notifications
- ✅ Profile Management

### 📍 Các Route Chính:

**Student:**
- `/student` - Dashboard
- `/student/search` - Tìm kiếm Tutor
- `/student/book` - Đặt lịch
- `/student/session` - Danh sách Sessions
- `/student/messages` - Messages
- `/student/calendar` - Lịch

**Tutor:**
- `/tutor` - Dashboard
- `/tutor/availability` - Đặt lịch rảnh
- `/tutor/sessions` - Quản lý Sessions
- `/tutor/messages` - Messages
- `/tutor/calendar` - Lịch

**Common:**
- `/common/forum` - Community Forum
- `/common/forum/create` - Tạo bài viết
- `/common/library` - Digital Library
- `/common/notifications` - Notifications
- `/common/profile` - Profile

## 📚 Tài Liệu Tham Khảo

- `HUONG_DAN_TEST_MESSAGING.md` - Hướng dẫn test messaging
- `HUONG_DAN_LONG_POLLING.md` - Chi tiết về Long Polling
- `FREE_WEBSOCKET_OPTIONS.md` - Các lựa chọn WebSocket miễn phí
- `MIEN_PHI_REALTIME.md` - Giải pháp real-time miễn phí

## 💡 Tips

1. **Development Mode**: Dùng `npm run dev:api` để auto-reload khi code thay đổi
2. **Hot Reload**: Frontend tự động reload khi code thay đổi
3. **Console Logs**: Kiểm tra console để debug
4. **Network Tab**: Dùng DevTools Network tab để xem API calls

## 🆘 Cần Giúp Đỡ?

Nếu gặp vấn đề:
1. Kiểm tra console logs
2. Kiểm tra terminal logs
3. Kiểm tra Network tab trong DevTools
4. Xem các file hướng dẫn trong project

