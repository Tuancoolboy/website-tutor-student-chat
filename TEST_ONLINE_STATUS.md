# Hướng Dẫn Test Online Status (Active Now)

## Mục đích

Script test này giúp kiểm tra tính năng "Active Now" hoạt động đúng khi có nhiều users kết nối cùng lúc.

## Yêu cầu

1. **WebSocket Server đang chạy:**
   ```bash
   npm run ws
   # hoặc
   npm run dev:ws
   ```

2. **API Server đang chạy:**
   ```bash
   npm run api
   # hoặc
   npm run dev:api
   ```

3. **Users trong database:**
   - Script sẽ sử dụng 2 users mặc định:
     - Student: `2365732@hcmut.edu.vn` (password: `password123`)
     - Tutor: `hoang.nam.hoang@hcmut.edu.vn` (password: `password123`)
   - Bạn có thể sửa trong file `scripts/test-online-status.ts` nếu muốn dùng users khác

## Cách chạy test

```bash
npm run test:online-status
```

## Script sẽ test:

1. ✅ Login 2 users và lấy JWT tokens
2. ✅ Kết nối User 1 đến WebSocket server
3. ✅ Kết nối User 2 đến WebSocket server
4. ✅ Kiểm tra User 1 có nhận được `user-online` event cho User 2 không
5. ✅ Kiểm tra User 2 có nhận được `user-online` event cho User 1 không
6. ✅ Kiểm tra User 2 có nhận được danh sách online users ban đầu không
7. ✅ Test disconnect: User 1 disconnect, User 2 có nhận được `user-offline` event không
8. ✅ Test API endpoint `/api/online-users` có trả về đúng danh sách không

## Kết quả mong đợi

### ✅ Test Pass nếu:

- User 1 nhận được `user-online` event khi User 2 connect
- User 2 nhận được `user-online` event khi User 1 connect (hoặc trong danh sách online users ban đầu)
- User 2 nhận được `user-offline` event khi User 1 disconnect
- API endpoint `/api/online-users` trả về đúng danh sách users đang online

### ❌ Test Fail nếu:

- Users không nhận được events từ nhau
- Danh sách online users không chính xác
- Events không được broadcast đúng cách

## Các vấn đề có thể gặp

### 1. WebSocket Server không chạy
```
Error: Connection timeout
```
**Giải pháp:** Đảm bảo WebSocket server đang chạy trên port 3001

### 2. API Server không chạy
```
Login failed for user@example.com
```
**Giải pháp:** Đảm bảo API server đang chạy trên port 3000

### 3. Users không tồn tại hoặc sai password
```
Login failed for user@example.com
```
**Giải pháp:** Kiểm tra users trong `data/users.json` và cập nhật email/password trong script test

### 4. JWT Secret không khớp
```
Authentication failed
```
**Giải pháp:** Đảm bảo `JWT_SECRET` trong script test khớp với `JWT_SECRET` trong `.env` hoặc `lib/config.ts`

## Sửa đổi script test

Nếu muốn test với users khác, sửa trong `scripts/test-online-status.ts`:

```typescript
const TEST_USERS = [
  {
    email: 'your-student@hcmut.edu.vn',
    password: 'password123',
    name: 'Student'
  },
  {
    email: 'your-tutor@hcmut.edu.vn',
    password: 'password123',
    name: 'Tutor'
  }
];
```

## Cải tiến đã thực hiện

1. **WebSocket Server (`ws-server.ts`):**
   - Gửi danh sách online users hiện tại khi client mới connect
   - Broadcast `user-online` event cho tất cả clients khác (không bao gồm client mới)
   - Broadcast `user-offline` event khi user disconnect

2. **React Hook (`useOnlineStatus.ts`):**
   - Nhận và xử lý danh sách online users ban đầu từ server
   - Cập nhật state khi nhận được `user-online` và `user-offline` events

3. **Messages Component:**
   - Sử dụng `isUserOnline()` để kiểm tra user có online không
   - Hiển thị "Active Now" section với users đang online
   - Hiển thị "No online users" khi không có users online

## Notes

- Script test này chỉ test logic WebSocket, không test UI
- Để test UI, bạn cần mở 2 trình duyệt khác nhau (hoặc incognito mode) và login với 2 users khác nhau
- WebSocket server sử dụng in-memory storage, nên khi restart server, tất cả online users sẽ bị reset

