# Hướng dẫn Test Real-time Messaging

## ✅ Đã hoàn thành

1. ✅ Tích hợp Long Polling vào Messages component (Tutor & Student)
2. ✅ Tích hợp conversationsAPI để load conversations
3. ✅ Real-time messaging với Long Polling
4. ✅ Hiển thị connection status
5. ✅ Gửi và nhận messages

## 🚀 Cách Test

### Bước 1: Khởi động API Server

```bash
npm run api
```

API server sẽ chạy tại `http://localhost:3000`

### Bước 2: Khởi động Frontend

Mở terminal mới:

```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173`

### Bước 3: Test với 2 Users

#### Option 1: Sử dụng 2 trình duyệt/2 tab

1. **Tab 1 - Student:**
   - Mở `http://localhost:5173`
   - Login với:
     - Email: `student@test.com`
     - Password: `password123`
   - Navigate đến `/student/messages`

2. **Tab 2 - Tutor:**
   - Mở `http://localhost:5173` (hoặc incognito)
   - Login với:
     - Email: `tutor@test.com`
     - Password: `password123`
   - Navigate đến `/tutor/messages`

#### Option 2: Chạy Test Script

```bash
# Đảm bảo API server đang chạy
npm run api

# Mở terminal mới và chạy test
npm run test:messages
```

Script sẽ:
- Tạo/Login 2 users (student & tutor)
- Tạo conversation giữa họ
- Gửi messages từ cả 2 users
- Test Long Polling

### Bước 4: Test Real-time Messaging

1. **Tạo Conversation:**
   - Nếu chưa có conversation, system sẽ tự động tạo khi bạn gửi message đầu tiên
   - Hoặc tạo conversation qua API

2. **Gửi Messages:**
   - Chọn một conversation
   - Gửi message từ user 1
   - Message sẽ xuất hiện real-time ở user 2 (thông qua Long Polling)

3. **Kiểm tra Connection Status:**
   - Xem status "Đang kết nối" ở header của chat
   - Status sẽ tự động reconnect nếu mất kết nối

## 📋 API Endpoints

### Conversations
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id` - Get conversation

### Messages
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message
- `PUT /api/messages/:id/read` - Mark message as read

### Long Polling
- `GET /api/messages/poll?conversationId=:id&lastMessageId=:id` - Long poll for new messages

## 🔍 Troubleshooting

### Lỗi: "Connection refused"
- Đảm bảo API server đang chạy: `npm run api`
- Kiểm tra port 3000 không bị chiếm dụng

### Lỗi: "Authentication failed"
- Kiểm tra token trong localStorage
- Thử logout và login lại

### Messages không hiện real-time
- Kiểm tra console để xem Long Polling có đang chạy không
- Kiểm tra connection status trong UI
- Đảm bảo `conversationId` đúng

### Không có conversations
- Tạo conversation đầu tiên qua API hoặc UI
- Kiểm tra user IDs có đúng không

## 📝 Notes

- Long Polling sẽ tự động retry nếu mất kết nối
- Messages được lưu trong JSON files (`data/messages.json`, `data/conversations.json`)
- Connection status được hiển thị real-time trong UI
- Messages được load từ history khi mở conversation

## 🎯 Next Steps

1. ✅ Real-time messaging với Long Polling
2. 🔄 (Optional) Upgrade lên WebSocket nếu cần performance tốt hơn
3. 🔄 (Optional) Thêm typing indicators
4. 🔄 (Optional) Thêm read receipts
5. 🔄 (Optional) Thêm file/image sharing

