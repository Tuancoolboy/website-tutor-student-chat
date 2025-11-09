# Hướng Dẫn Test "Active Now" trên Cùng 1 Máy

## ✅ Có Thể Test trên Cùng 1 Máy!

Bạn **KHÔNG CẦN** 2 máy riêng biệt. Bạn có thể test "Active Now" trên **cùng 1 máy** bằng cách:

### Cách 1: 2 Tab Trình Duyệt (Đơn Giản Nhất)

1. **Mở Tab 1 - Student:**
   - Truy cập: `http://localhost:5173`
   - Đăng nhập với tài khoản Student:
     - Email: `2365732@hcmut.edu.vn`
     - Password: `password123`
   - Vào trang Messages: `/student/messages`

2. **Mở Tab 2 - Tutor:**
   - Mở tab mới trong **cùng trình duyệt** (hoặc trình duyệt khác)
   - Truy cập: `http://localhost:5173`
   - Đăng nhập với tài khoản Tutor:
     - Email: `hoang.nam.hoang@hcmut.edu.vn`
     - Password: `password123`
   - Vào trang Messages: `/tutor/messages`

3. **Kiểm Tra "Active Now":**
   - Khi cả 2 tab đều đã login và vào trang Messages
   - Tab Student sẽ thấy Tutor trong "Active Now"
   - Tab Tutor sẽ thấy Student trong "Active Now"
   - Nếu một tab đóng hoặc logout, tab kia sẽ thấy user đó offline

### Cách 2: 2 Trình Duyệt Khác Nhau (Chrome + Firefox)

1. **Trình Duyệt 1 (Chrome) - Student:**
   - Mở Chrome
   - Truy cập: `http://localhost:5173`
   - Đăng nhập: `2365732@hcmut.edu.vn` / `password123`
   - Vào `/student/messages`

2. **Trình Duyệt 2 (Firefox) - Tutor:**
   - Mở Firefox
   - Truy cập: `http://localhost:5173`
   - Đăng nhập: `hoang.nam.hoang@hcmut.edu.vn` / `password123`
   - Vào `/tutor/messages`

### Cách 3: Incognito/Private Mode

1. **Tab Thường - Student:**
   - Tab bình thường: `http://localhost:5173`
   - Login: `2365732@hcmut.edu.vn` / `password123`

2. **Tab Incognito - Tutor:**
   - Mở tab Incognito/Private (Ctrl+Shift+N hoặc Cmd+Shift+N)
   - Truy cập: `http://localhost:5173`
   - Login: `hoang.nam.hoang@hcmut.edu.vn` / `password123`

## 📋 Các Tài Khoản Test

### Student Accounts:
- **Email:** `2365732@hcmut.edu.vn`
- **Password:** `password123`
- **Name:** Phan An Hoàng

### Tutor Accounts:
- **Email:** `hoang.nam.hoang@hcmut.edu.vn`
- **Password:** `password123`
- **Name:** Hoàng Nam Hoàng

### Tutor Accounts Khác (nếu cần):
- **Email:** `nguyen.an.anh@hcmut.edu.vn`
- **Password:** `password123`
- **Name:** Nguyễn An Anh

## 🚀 Các Bước Chuẩn Bị

### 1. Đảm Bảo Các Server Đang Chạy:

**Terminal 1 - API Server:**
```bash
npm run api
# hoặc với auto-reload
npm run dev:api
```

**Terminal 2 - WebSocket Server:**
```bash
npm run ws
# hoặc với auto-reload
npm run dev:ws
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

### 2. Kiểm Tra Servers:
- API Server: `http://localhost:3000/health`
- WebSocket Server: `http://localhost:3001/health`
- Frontend: `http://localhost:5173`

## ✅ Kiểm Tra "Active Now" Hoạt Động

### Kịch Bản Test:

1. **Login Student (Tab 1):**
   - Student login vào `/student/messages`
   - "Active Now" sẽ rỗng (chưa có ai online)

2. **Login Tutor (Tab 2):**
   - Tutor login vào `/tutor/messages`
   - Tab Student sẽ thấy Tutor xuất hiện trong "Active Now"
   - Tab Tutor sẽ thấy Student trong "Active Now"

3. **Test Disconnect:**
   - Đóng tab Tutor (hoặc logout)
   - Tab Student sẽ thấy Tutor biến mất khỏi "Active Now"

4. **Test Reconnect:**
   - Mở lại tab Tutor và login
   - Tab Student sẽ thấy Tutor xuất hiện lại trong "Active Now"

## 🐛 Troubleshooting

### Vấn Đề: "Active Now" Không Hiển Thị User

**Nguyên nhân có thể:**
1. WebSocket server chưa chạy
2. Token không hợp lệ
3. WebSocket connection failed

**Cách kiểm tra:**
1. Mở Console trong trình duyệt (F12)
2. Kiểm tra logs:
   - `[useOnlineStatus] WebSocket connected` ✅
   - `[useOnlineStatus] User online: ...` ✅
3. Kiểm tra Network tab:
   - WebSocket connection: `ws://localhost:3001/socket.io/?EIO=4&transport=websocket`
   - Status: `101 Switching Protocols` ✅

### Vấn Đề: WebSocket Connection Failed

**Kiểm tra:**
1. WebSocket server có đang chạy không?
   ```bash
   curl http://localhost:3001/health
   ```
2. CORS settings trong `ws-server.ts`
3. Token có hợp lệ không?
   - Kiểm tra localStorage: `localStorage.getItem('token')`
   - Token phải bắt đầu bằng `eyJhbGciOiJIUzI1NiIs...`

### Vấn Đề: User Không Thấy User Kia Online

**Kiểm tra:**
1. Cả 2 tab đều đã login chưa?
2. Cả 2 tab đều vào trang Messages chưa?
3. WebSocket server logs:
   - `[Socket.io] ✅ User connected successfully: ...`
   - `[Socket.io] Emitting 'connected' event to ... with onlineUsers: [...]`
   - `[Socket.io] Broadcasting 'user-online' event for ...`

## 📝 Ghi Chú

- **Cùng 1 máy = Cùng 1 localhost:** Cả 2 tab/window đều kết nối đến `http://localhost:5173`
- **WebSocket Server:** Cả 2 tab đều kết nối đến `http://localhost:3001`
- **Session độc lập:** Mỗi tab/window có session riêng (cookie/localStorage riêng)
- **Active Now:** Hiển thị users đang **online** (connected qua WebSocket), không phải dựa trên messages

## 🎯 Kết Quả Mong Đợi

✅ Student login → "Active Now" rỗng
✅ Tutor login → Student thấy Tutor trong "Active Now"
✅ Tutor login → Tutor thấy Student trong "Active Now"
✅ Tutor logout/disconnect → Student thấy Tutor biến mất
✅ Tutor login lại → Student thấy Tutor xuất hiện lại

## 💡 Tips

1. **Dùng DevTools:** Mở Console (F12) để xem logs WebSocket
2. **Kiểm tra Network:** Xem WebSocket connection trong Network tab
3. **Clear Cache:** Nếu gặp lỗi, thử clear cache và reload
4. **Incognito Mode:** Dùng Incognito để test với session hoàn toàn mới

