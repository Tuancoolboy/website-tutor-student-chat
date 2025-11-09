# Hướng Dẫn Hệ Thống Nhắn Tin Tự Động Tạo Conversation

## 📋 Tổng Quan

Hệ thống nhắn tin của ứng dụng hỗ trợ **tự động tạo conversation** khi user muốn nhắn tin với người khác. Bạn không cần phải tạo conversation thủ công trước khi nhắn tin.

## 🎯 Cách Hoạt Động

### 1. **Khi Đăng Ký Tài Khoản**

- Khi tạo tài khoản mới (Student/Tutor/Management), hệ thống **KHÔNG** tự động tạo conversation với tất cả users khác
- Điều này tránh tạo quá nhiều conversations không cần thiết
- Users chỉ có conversation khi họ thực sự muốn nhắn tin với nhau

### 2. **Tự Động Tạo Conversation**

Hệ thống tự động tạo conversation khi:

#### Cách 1: Gửi Message Trực Tiếp (Mới - Khuyến Nghị)
```typescript
// Sử dụng API mới: POST /api/messages/send
const response = await conversationsAPI.sendToUser({
  receiverId: 'tut_xxx',  // ID của người nhận
  content: 'Hello!',
  type: 'text'
});

// Hệ thống sẽ:
// 1. Tự động tạo conversation nếu chưa có
// 2. Gửi message
// 3. Trả về cả message và conversation
```

#### Cách 2: Tạo Conversation Thủ Công (Cũ)
```typescript
// Bước 1: Tạo conversation
const convResponse = await conversationsAPI.create({
  participantIds: ['tut_xxx']
});

// Bước 2: Gửi message
const msgResponse = await conversationsAPI.messages.send(convResponse.data.id, {
  content: 'Hello!'
});
```

## 🔄 Luồng Hoạt Động

### Khi User Muốn Nhắn Tin:

1. **User A** muốn nhắn tin với **User B**
2. User A gọi API `POST /api/messages/send` với `receiverId = User B`
3. Hệ thống kiểm tra:
   - Nếu conversation đã tồn tại → Sử dụng conversation đó
   - Nếu chưa có → Tự động tạo conversation mới
4. Hệ thống tạo và lưu message
5. Trả về message và conversation

### Ví Dụ:

```typescript
// Student muốn nhắn tin với Tutor
const response = await api.conversations.sendToUser({
  receiverId: 'tut_32pVB7L-Yyjf',  // ID của tutor
  content: 'Xin chào thầy! Em muốn hỏi về bài học.',
  type: 'text'
});

if (response.success) {
  const { message, conversation } = response.data;
  // message: Tin nhắn vừa gửi
  // conversation: Conversation được tạo hoặc sử dụng
  console.log('Conversation ID:', conversation.id);
  console.log('Message ID:', message.id);
}
```

## 📍 Lưu Trữ Dữ Liệu

### 1. **Conversations**
- File: `data/conversations.json`
- Mỗi conversation chứa:
  - `id`: ID duy nhất
  - `participants`: [userId1, userId2] - Danh sách người tham gia
  - `unreadCount`: Số tin nhắn chưa đọc cho mỗi user
  - `lastMessage`: Tin nhắn cuối cùng
  - `createdAt`, `updatedAt`: Thời gian tạo và cập nhật

### 2. **Messages**
- File: `data/messages.json`
- Mỗi message chứa:
  - `id`: ID duy nhất
  - `conversationId`: ID của conversation
  - `senderId`: ID người gửi
  - `receiverId`: ID người nhận
  - `content`: Nội dung tin nhắn
  - `type`: Loại tin nhắn ('text', 'file', 'image')
  - `read`: Đã đọc chưa
  - `createdAt`: Thời gian gửi

## 🚀 Sử Dụng Trong Frontend

### Cách 1: Sử dụng API mới (Khuyến Nghị)

```typescript
import { conversationsAPI } from '../lib/api';

// Gửi message trực tiếp
const handleSendMessage = async (receiverId: string, content: string) => {
  try {
    const response = await conversationsAPI.sendToUser({
      receiverId,
      content,
      type: 'text'
    });

    if (response.success) {
      const { message, conversation } = response.data;
      // Reload conversations list
      await loadConversations();
      // Select the conversation
      setSelectedConversationId(conversation.id);
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};
```

### Cách 2: Tạo conversation trước (Cũ)

```typescript
// Bước 1: Tạo hoặc lấy conversation
const createOrGetConversation = async (receiverId: string) => {
  // Kiểm tra conversation đã tồn tại chưa
  const conversations = await conversationsAPI.list();
  const existing = conversations.data.find(conv => 
    conv.participants.includes(receiverId)
  );

  if (existing) {
    return existing;
  }

  // Tạo conversation mới
  const response = await conversationsAPI.create({
    participantIds: [receiverId]
  });
  return response.data;
};

// Bước 2: Gửi message
const handleSendMessage = async (receiverId: string, content: string) => {
  const conversation = await createOrGetConversation(receiverId);
  await conversationsAPI.messages.send(conversation.id, {
    content,
    type: 'text'
  });
};
```

## ✅ Lợi Ích

1. **Đơn Giản Hóa**: Không cần tạo conversation thủ công
2. **Tự Động**: Conversation được tạo tự động khi cần
3. **Hiệu Quả**: Chỉ tạo conversation khi user thực sự nhắn tin
4. **Tiện Lợi**: User có thể nhắn tin ngay với bất kỳ ai trong hệ thống

## 🔍 API Endpoints

### 1. Gửi Message Trực Tiếp (Mới)
```
POST /api/messages/send
Body: {
  receiverId: string,
  content: string,
  type?: 'text' | 'file' | 'image',
  fileUrl?: string
}
Response: {
  success: true,
  data: {
    message: Message,
    conversation: Conversation
  }
}
```

### 2. Tạo Conversation Thủ Công (Cũ)
```
POST /api/conversations
Body: {
  participantIds: string[]
}
Response: {
  success: true,
  data: Conversation
}
```

### 3. Gửi Message Trong Conversation
```
POST /api/conversations/:id/messages
Body: {
  content: string,
  type?: 'text' | 'file' | 'image',
  fileUrl?: string
}
Response: {
  success: true,
  data: Message
}
```

## 📝 Lưu Ý

1. **Conversation chỉ được tạo khi cần**: Hệ thống không tạo conversation với tất cả users khi đăng ký
2. **Tự động kiểm tra duplicate**: Nếu conversation đã tồn tại, hệ thống sẽ sử dụng conversation đó
3. **Hỗ trợ cả 2 cách**: Bạn có thể dùng API mới hoặc cách cũ
4. **Backward compatible**: API cũ vẫn hoạt động bình thường

## 🎉 Kết Luận

Với tính năng tự động tạo conversation, users có thể:
- ✅ Nhắn tin ngay với bất kỳ ai trong hệ thống
- ✅ Không cần tạo conversation thủ công
- ✅ Hệ thống tự động quản lý conversations
- ✅ Trải nghiệm người dùng tốt hơn

---

**Tác Giả**: Hệ thống Tutor Support
**Cập Nhật**: 2025-11-09

