# Hướng Dẫn Test Giữa Student và Tutor

## 🚀 Cách Chạy Ứng Dụng

### Bước 1: Khởi động API Server (Terminal 1)

```bash
npm run api
```

API server sẽ chạy tại: `http://localhost:3000`
- Health check: `http://localhost:3000/health`
- API Base: `http://localhost:3000/api`

### Bước 2: Khởi động Frontend (Terminal 2)

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

### Bước 3: Khởi động WebSocket Server (Tùy chọn - Terminal 3)

Nếu bạn muốn test real-time messaging với WebSocket (thay vì Long Polling):

```bash
npm run ws
```

WebSocket server sẽ chạy tại: `ws://localhost:3001`

> **Lưu ý:** Nếu không chạy WebSocket server, hệ thống sẽ tự động sử dụng Long Polling (miễn phí, không cần WebSocket server riêng).

---

## 🧪 Test Giữa Student và Tutor

### Cách 1: Tự động tạo Test Users (Khuyên dùng)

#### Bước 1: Chạy script test để tạo users và conversation

```bash
# Đảm bảo API server đang chạy (npm run api)
npm run test:messages
```

Script này sẽ:
- ✅ Tự động tạo 2 users: `student@test.com` và `tutor@test.com`
- ✅ Tạo conversation giữa họ
- ✅ Gửi một vài messages mẫu

#### Bước 2: Mở 2 tab trình duyệt

**Tab 1 - Student:**
1. Mở `http://localhost:5173`
2. Login với:
   - **Email:** `student@test.com`
   - **Password:** `password123`
3. Navigate đến `/student/messages`

**Tab 2 - Tutor:**
1. Mở `http://localhost:5173` (hoặc dùng chế độ incognito/cửa sổ riêng)
2. Login với:
   - **Email:** `tutor@test.com`
   - **Password:** `password123`
3. Navigate đến `/tutor/messages`

#### Bước 3: Test Real-time Messaging

1. **Tạo/Chọn Conversation:**
   - Conversation đã được tạo sẵn bởi script test
   - Hoặc tạo mới conversation trong UI

2. **Gửi Messages:**
   - Gửi message từ Tab 1 (Student)
   - Message sẽ xuất hiện real-time ở Tab 2 (Tutor)
   - Gửi message từ Tab 2 (Tutor)
   - Message sẽ xuất hiện real-time ở Tab 1 (Student)

3. **Kiểm tra Connection Status:**
   - Xem status "Đang kết nối" ở header của chat
   - Status sẽ tự động reconnect nếu mất kết nối

---

### Cách 2: Tạo Users Thủ Công

Nếu không muốn chạy script test, bạn có thể đăng ký users mới:

#### Bước 1: Đăng ký Student

1. Mở `http://localhost:5173`
2. Vào trang đăng ký
3. Đăng ký với:
   - **Email:** `student@test.com` (hoặc email khác)
   - **Password:** `password123`
   - **Role:** Student
   - **Name:** Test Student

#### Bước 2: Đăng ký Tutor

1. Mở tab/trình duyệt mới: `http://localhost:5173`
2. Vào trang đăng ký
3. Đăng ký với:
   - **Email:** `tutor@test.com` (hoặc email khác)
   - **Password:** `password123`
   - **Role:** Tutor
   - **Name:** Test Tutor

#### Bước 3: Test Messaging

1. Login cả 2 users
2. Vào Messages page
3. Tạo conversation giữa 2 users
4. Gửi messages và test real-time

---

## 📋 Các Route Test

### Student Routes
- `/student` - Dashboard
- `/student/search` - Tìm kiếm Tutor
- `/student/book` - Đặt lịch học
- `/student/session` - Danh sách Sessions
- `/student/messages` - **Messages (Test ở đây)**
- `/student/calendar` - Lịch học

### Tutor Routes
- `/tutor` - Dashboard
- `/tutor/availability` - Đặt lịch rảnh
- `/tutor/sessions` - Quản lý Sessions
- `/tutor/messages` - **Messages (Test ở đây)**
- `/tutor/calendar` - Lịch dạy

---

## 🔍 Kiểm Tra

### 1. Kiểm tra API Server

```bash
curl http://localhost:3000/health
```

Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

### 2. Kiểm tra Frontend

Mở trình duyệt: `http://localhost:5173`

### 3. Kiểm tra Users

Sau khi chạy `npm run test:messages`, kiểm tra file `data/users.json` để xem users đã được tạo.

### 4. Kiểm tra Conversations

Sau khi chạy `npm run test:messages`, kiểm tra file `data/conversations.json` để xem conversations đã được tạo.

### 5. Kiểm tra Messages

Sau khi chạy `npm run test:messages`, kiểm tra file `data/messages.json` để xem messages đã được tạo.

---

## 🐛 Troubleshooting

### Lỗi: "Connection refused"

**Giải pháp:**
- Đảm bảo API server đang chạy: `npm run api`
- Kiểm tra port 3000 không bị chiếm dụng

### Lỗi: "Authentication failed"

**Giải pháp:**
- Kiểm tra token trong localStorage (F12 > Application > Local Storage)
- Thử logout và login lại
- Đảm bảo đã chạy `npm run test:messages` để tạo users

### Messages không hiện real-time

**Giải pháp:**
- Kiểm tra console (F12 > Console) để xem Long Polling có đang chạy không
- Kiểm tra connection status trong UI
- Đảm bảo `conversationId` đúng
- Kiểm tra Network tab (F12 > Network) để xem API calls

### Không có conversations

**Giải pháp:**
- Chạy `npm run test:messages` để tạo conversation tự động
- Hoặc tạo conversation mới qua UI
- Kiểm tra user IDs có đúng không

### Users không tồn tại

**Giải pháp:**
- Chạy `npm run test:messages` để tạo users tự động
- Hoặc đăng ký users mới qua UI
- Kiểm tra file `data/users.json` xem users đã được tạo chưa

---

## 💡 Tips

1. **Sử dụng 2 trình duyệt khác nhau:**
   - Chrome cho Student
   - Firefox/Safari cho Tutor
   - Hoặc dùng chế độ incognito

2. **Kiểm tra Console:**
   - Mở DevTools (F12) ở cả 2 tab
   - Xem logs để debug

3. **Kiểm tra Network:**
   - Mở Network tab (F12 > Network)
   - Xem API calls và responses

4. **Test Long Polling:**
   - Xem requests `/api/messages/poll` trong Network tab
   - Long polling sẽ tự động retry nếu mất kết nối

5. **Test WebSocket (nếu chạy):**
   - Xem WebSocket connection trong Network tab
   - Kiểm tra messages được gửi qua WebSocket

---

## 📝 Tóm Tắt

### Để test giữa Student và Tutor:

1. ✅ Chạy `npm run api` (Terminal 1)
2. ✅ Chạy `npm run dev` (Terminal 2)
3. ✅ (Tùy chọn) Chạy `npm run ws` (Terminal 3)
4. ✅ Chạy `npm run test:messages` để tạo users và conversation
5. ✅ Mở 2 tab trình duyệt:
   - Tab 1: Login `student@test.com` / `password123`
   - Tab 2: Login `tutor@test.com` / `password123`
6. ✅ Vào Messages page và test real-time messaging

---

## 🎯 Kết Quả Mong Đợi

- ✅ Messages hiển thị real-time giữa 2 users
- ✅ Connection status hiển thị "Đang kết nối"
- ✅ Messages được lưu và hiển thị lại khi reload
- ✅ Long Polling tự động reconnect nếu mất kết nối
- ✅ UI responsive và hiện đại

---

**Chúc bạn test thành công! 🚀**

