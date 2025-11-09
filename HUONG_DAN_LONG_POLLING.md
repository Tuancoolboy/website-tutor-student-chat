# Hướng Dẫn Sử Dụng Long Polling (100% Miễn Phí)

## ✅ Giải Pháp Hoàn Toàn MIỄN PHÍ

**Long Polling** là giải pháp **100% miễn phí** cho real-time messaging:
- ✅ Chạy trên Vercel (free tier)
- ✅ Không cần server riêng
- ✅ Không cần dịch vụ bên thứ ba
- ✅ Đủ dùng cho hầu hết ứng dụng
- ⚠️ Độ trễ: 1-2 giây (không đáng kể)

## 🚀 Đã Tạo Sẵn

1. ✅ **API Endpoint:** `api/messages/poll.ts`
2. ✅ **React Hook:** `src/hooks/useLongPolling.ts`
3. ✅ **API Client:** `src/lib/api.ts` (đã thêm conversationsAPI)

## 📝 Cách Sử Dụng

### Bước 1: Import Hook

```typescript
import { useLongPolling } from '../../hooks/useLongPolling';
```

### Bước 2: Sử Dụng trong Component

```typescript
const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  const { messages, isPolling, isConnected, sendMessage, loadHistory } = useLongPolling({
    conversationId: selectedConversation,
    enabled: !!selectedConversation,
    onMessage: (message) => {
      console.log('New message:', message);
      // Có thể play sound, show notification, etc.
    },
    onError: (error) => {
      console.error('Polling error:', error);
    }
  });

  // Load message history khi chọn conversation
  useEffect(() => {
    if (selectedConversation) {
      loadHistory();
    }
  }, [selectedConversation, loadHistory]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;
    
    try {
      await sendMessage(content);
      // Message sẽ tự động xuất hiện qua polling
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Không thể gửi tin nhắn');
    }
  };

  return (
    <div>
      <div>
        <h2>Messages</h2>
        {isConnected ? (
          <span style={{ color: 'green' }}>● Đang kết nối</span>
        ) : (
          <span style={{ color: 'red' }}>● Đang kết nối lại...</span>
        )}
        {isPolling && <span> (Đang tải...)</span>}
      </div>
      
      <div>
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.senderId}:</strong> {msg.content}
            <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
      
      <input
        type="text"
        placeholder="Nhập tin nhắn..."
        onKeyPress={(e) => {
          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            handleSendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
};
```

### Bước 3: Tích Hợp Vào Messages Component

Cập nhật file `src/pages/tutor/Messages.tsx` hoặc `src/pages/student/Messages.tsx`:

```typescript
import { useLongPolling } from '../../hooks/useLongPolling';
import { conversationsAPI } from '../../lib/api';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  
  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await conversationsAPI.list();
        if (response.success) {
          setConversations(response.data);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };
    loadConversations();
  }, []);

  // Long polling hook
  const { messages, isPolling, isConnected, sendMessage, loadHistory } = useLongPolling({
    conversationId: selectedConversationId,
    enabled: !!selectedConversationId,
    onMessage: (message) => {
      // Play notification sound
      // Show browser notification
      // Update UI
    }
  });

  // Load history when conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      loadHistory();
    }
  }, [selectedConversationId, loadHistory]);

  return (
    <div>
      {/* Conversation list */}
      <div>
        {conversations.map(conv => (
          <div 
            key={conv.id}
            onClick={() => setSelectedConversationId(conv.id)}
            style={{
              cursor: 'pointer',
              backgroundColor: selectedConversationId === conv.id ? '#e0e0e0' : 'white'
            }}
          >
            <div>{conv.participants.join(', ')}</div>
            <div>{conv.lastMessage?.content}</div>
            {conv.unreadCount > 0 && (
              <span>{conv.unreadCount} tin nhắn mới</span>
            )}
          </div>
        ))}
      </div>

      {/* Messages */}
      {selectedConversationId && (
        <div>
          <div>
            {isConnected ? '● Đang kết nối' : '● Đang kết nối lại...'}
            {isPolling && ' (Đang tải...)'}
          </div>
          
          <div>
            {messages.map(msg => (
              <div key={msg.id}>
                <strong>{msg.senderId}:</strong> {msg.content}
                <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
              </div>
            ))}
          </div>
          
          <input
            type="text"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                sendMessage(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
```

## 🧪 Test

1. **Start API server:**
   ```bash
   npm run api
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Test:**
   - Mở 2 browser windows
   - Login với 2 users khác nhau
   - Tạo conversation
   - Gửi message từ user 1
   - Message sẽ xuất hiện ở user 2 sau 1-2 giây

## 📊 So Sánh

| Tính năng | Long Polling | WebSocket |
|-----------|--------------|-----------|
| **Chi phí** | ✅ FREE | ⚠️ Cần server riêng |
| **Real-time** | ⚠️ 1-2s delay | ✅ Instant |
| **Độ khó** | ⭐ Dễ | ⭐⭐ Trung bình |
| **Cần server riêng** | ❌ Không | ✅ Có |
| **Đủ dùng** | ✅ Có | ✅ Có |

## ✅ Kết Luận

**Long Polling là giải pháp tốt nhất cho bạn:**
- ✅ 100% miễn phí
- ✅ Không cần setup thêm
- ✅ Đủ dùng cho ứng dụng
- ✅ Độ trễ 1-2 giây không đáng kể

## 🔧 Troubleshooting

### Vấn đề: Messages không xuất hiện

**Giải pháp:**
1. Kiểm tra authentication token
2. Kiểm tra conversationId có đúng không
3. Kiểm tra console logs
4. Kiểm tra API endpoint có hoạt động không

### Vấn đề: Polling không stop

**Giải pháp:**
- Component sẽ tự cleanup khi unmount
- Đảm bảo `enabled` prop được set đúng

### Vấn đề: Quá nhiều requests

**Giải pháp:**
- Long polling tự động throttle
- Mỗi request chỉ kéo dài tối đa 25 giây
- Không có request mới cho đến khi request cũ kết thúc

## 📚 Next Steps

1. ✅ Integrate vào Messages component
2. ✅ Test với 2 users
3. ✅ Add UI improvements (typing indicator, read receipts, etc.)
4. ✅ Deploy lên Vercel

Bạn đã sẵn sàng sử dụng! 🚀

