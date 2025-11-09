# Hướng Dẫn Tạo 2 Account Test và Chat

## 🚀 Cách 1: Sử dụng Script Tự Động (Khuyên dùng)

### Bước 1: Đảm bảo API Server đang chạy

```bash
npm run api
```

API server sẽ chạy tại: `http://localhost:3000`

### Bước 2: Chạy script tạo accounts

```bash
npm run create:test-accounts
```

Script sẽ tự động:
- ✅ Tạo 2 accounts: Student và Tutor
- ✅ Tạo conversation giữa họ
- ✅ Hiển thị thông tin đăng nhập

### Bước 3: Kiểm tra thông tin accounts

Sau khi chạy script, bạn sẽ thấy:
```
📋 Account Information:
   Student: student.test@hcmut.edu.vn / password123
   Tutor: tutor.test@hcmut.edu.vn / password123
```

---

## 🚀 Cách 2: Tạo Account Thủ Công trên Web

### Bước 1: Khởi động Frontend

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

### Bước 2: Tạo Student Account

1. Mở trình duyệt: `http://localhost:5173`
2. Click vào "Sign up" hoặc truy cập: `http://localhost:5173/common/register`
3. Điền thông tin:
   - **Full Name:** Test Student
   - **Email:** student.test@hcmut.edu.vn
   - **Password:** password123
   - **Confirm Password:** password123
   - **Role:** Student
   - ✅ Đồng ý với Terms and Conditions
4. Click "Create Account"
5. Sẽ tự động chuyển đến `/student` dashboard

### Bước 3: Tạo Tutor Account

1. Mở tab/trình duyệt mới (hoặc incognito): `http://localhost:5173`
2. Click vào "Sign up" hoặc truy cập: `http://localhost:5173/common/register`
3. Điền thông tin:
   - **Full Name:** Test Tutor
   - **Email:** tutor.test@hcmut.edu.vn
   - **Password:** password123
   - **Confirm Password:** password123
   - **Role:** Tutor
   - ✅ Đồng ý với Terms and Conditions
4. Click "Create Account"
5. Sẽ tự động chuyển đến `/tutor` dashboard

---

## 💬 Test Chat Giữa 2 Accounts

### Bước 1: Mở 2 Tab/Trình Duyệt

**Tab 1 - Student:**
1. Mở `http://localhost:5173`
2. Login với:
   - Email: `student.test@hcmut.edu.vn`
   - Password: `password123`
3. Navigate đến: `/student/messages`

**Tab 2 - Tutor:**
1. Mở `http://localhost:5173` (hoặc incognito/window mới)
2. Login với:
   - Email: `tutor.test@hcmut.edu.vn`
   - Password: `password123`
3. Navigate đến: `/tutor/messages`

### Bước 2: Tạo Conversation (nếu chưa có)

Nếu chưa có conversation:

**Cách 1: Sử dụng Script**
```bash
npm run create:test-accounts
```

**Cách 2: Tạo thủ công qua API**
- Hoặc gửi message đầu tiên sẽ tự động tạo conversation

### Bước 3: Test Chat

1. **Chọn Conversation:**
   - Ở Tab 1 (Student), click vào conversation với Tutor
   - Ở Tab 2 (Tutor), click vào conversation với Student

2. **Gửi Messages:**
   - Gửi message từ Tab 1 (Student)
   - Message sẽ hiển thị real-time ở Tab 2 (Tutor)
   - Gửi message từ Tab 2 (Tutor)
   - Message sẽ hiển thị real-time ở Tab 1 (Student)

3. **Kiểm tra Real-time:**
   - Messages hiển thị ngay lập tức (qua Long Polling)
   - Connection status hiển thị "Đang kết nối"
   - Messages được lưu và hiển thị lại khi reload

---

## 🐛 Troubleshooting

### Lỗi: "Email đã được sử dụng"

**Giải pháp:**
- Accounts đã tồn tại, bạn có thể login trực tiếp
- Hoặc sử dụng email khác để tạo account mới

### Lỗi: "Không có cuộc trò chuyện nào"

**Giải pháp:**
1. Chạy script để tạo conversation:
   ```bash
   npm run create:test-accounts
   ```
2. Hoặc gửi message đầu tiên sẽ tự động tạo conversation
3. Kiểm tra console để xem có lỗi gì không

### Lỗi: "Authentication failed"

**Giải pháp:**
1. Kiểm tra token trong localStorage (F12 → Application → Local Storage)
2. Thử logout và login lại
3. Đảm bảo API server đang chạy

### Lỗi: "Cannot connect to API server"

**Giải pháp:**
1. Đảm bảo API server đang chạy: `npm run api`
2. Kiểm tra port 3000 không bị chiếm dụng
3. Kiểm tra `API_BASE_URL` trong `src/env.ts`

### Messages không hiển thị real-time

**Giải pháp:**
1. Kiểm tra console (F12 → Console) để xem có lỗi gì không
2. Kiểm tra Network tab (F12 → Network) để xem Long Polling có đang chạy không
3. Kiểm tra connection status trong UI
4. Đảm bảo `conversationId` đúng

---

## 📋 Checklist

- [ ] API Server đang chạy (`npm run api`)
- [ ] Frontend đang chạy (`npm run dev`)
- [ ] Đã tạo Student account
- [ ] Đã tạo Tutor account
- [ ] Đã tạo conversation (hoặc sẽ tự động tạo khi gửi message đầu tiên)
- [ ] Đã mở 2 tab/window với 2 accounts khác nhau
- [ ] Đã navigate đến Messages page
- [ ] Đã chọn conversation
- [ ] Đã test gửi/nhận messages real-time

---

## 💡 Tips

1. **Sử dụng 2 trình duyệt khác nhau:**
   - Chrome cho Student
   - Firefox/Safari cho Tutor
   - Hoặc dùng chế độ incognito

2. **Kiểm tra Console:**
   - Mở DevTools (F12) ở cả 2 tab
   - Xem logs để debug
   - Tìm `[Messages]` logs để xem quá trình load

3. **Kiểm tra Network:**
   - Mở Network tab (F12 → Network)
   - Xem API calls và responses
   - Tìm `/api/conversations` và `/api/messages/poll`

4. **Test với Script:**
   - Sử dụng `npm run test:messages` để test messaging system
   - Sử dụng `npm run create:test-accounts` để tạo accounts nhanh

---

## 🎯 Kết Quả Mong Đợi

- ✅ 2 accounts được tạo thành công
- ✅ Conversation được tạo giữa 2 accounts
- ✅ Messages hiển thị real-time giữa 2 users
- ✅ Connection status hiển thị "Đang kết nối"
- ✅ Messages được lưu và hiển thị lại khi reload
- ✅ UI responsive và hiện đại

---

## 📞 Cần Giúp Đỡ?

Nếu gặp vấn đề:
1. Kiểm tra console logs
2. Kiểm tra terminal logs (API server)
3. Kiểm tra Network tab trong DevTools
4. Xem các file hướng dẫn khác trong project

---

**Chúc bạn test thành công! 🚀**

