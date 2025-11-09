# Fix Lỗi "Failed to fetch" trên Vercel

## 🐛 Vấn Đề

**Lỗi:** "Failed to fetch" khi gửi tin nhắn trên Vercel
- ✅ Localhost: Gửi tin nhắn được
- ❌ Vercel: Lỗi "Failed to fetch"

## 🔍 Nguyên Nhân Có Thể

### 1. API Route Không Được Rewrite Đúng
- `vercel.json` có thể không rewrite đúng route `/api/conversations/:id/messages`

### 2. CORS Error
- CORS chưa được cấu hình đúng trên Vercel
- API server không cho phép request từ frontend domain

### 3. Authentication Token
- Token không được gửi đúng
- Token hết hạn

### 4. API Endpoint Không Tồn Tại
- Route `/api/conversations/:id/messages` không được handle đúng

## ✅ Giải Pháp

### Bước 1: Kiểm Tra API Route

Kiểm tra `vercel.json` có rewrite đúng không:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    }
  ]
}
```

### Bước 2: Kiểm Tra CORS

Đảm bảo CORS được cấu hình đúng trong `server.ts`:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '*' : config.frontend.url),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Bước 3: Kiểm Tra Browser Console

1. Mở browser: `https://website-tutor-student-s8rl.vercel.app`
2. Mở Console (F12)
3. Thử gửi tin nhắn
4. Xem lỗi chi tiết:
   - CORS error?
   - 404 Not Found?
   - 401 Unauthorized?
   - Network error?

### Bước 4: Kiểm Tra Network Tab

1. Mở Network tab (F12 → Network)
2. Thử gửi tin nhắn
3. Tìm request `POST /api/conversations/.../messages`
4. Kiểm tra:
   - Request URL đúng không?
   - Status code là gì?
   - Response là gì?

## 🔧 Các Lỗi Thường Gặp

### Lỗi 1: CORS Error

**Triệu chứng:**
```
Access to fetch at 'https://website-tutor-student-s8rl.vercel.app/api/...' from origin 'https://website-tutor-student-s8rl.vercel.app' has been blocked by CORS policy
```

**Giải pháp:**
1. Kiểm tra CORS trong `server.ts`
2. Đảm bảo `origin` được set đúng
3. Đảm bảo `credentials: true`
4. Đảm bảo `methods` có `POST`

### Lỗi 2: 404 Not Found

**Triệu chứng:**
```
404 Not Found
```

**Giải pháp:**
1. Kiểm tra `vercel.json` có rewrite đúng không
2. Kiểm tra route có tồn tại trong `server.ts` không
3. Kiểm tra API endpoint có được export đúng không

### Lỗi 3: 401 Unauthorized

**Triệu chứng:**
```
401 Unauthorized
```

**Giải pháp:**
1. Kiểm tra token có được gửi đúng không
2. Kiểm tra token có hết hạn không
3. Đăng xuất và đăng nhập lại

### Lỗi 4: Network Error

**Triệu chứng:**
```
Failed to fetch
Network error
```

**Giải pháp:**
1. Kiểm tra API server có đang chạy không
2. Kiểm tra URL có đúng không
3. Kiểm tra firewall/network settings

## 🚀 Debug Steps

### Step 1: Test API Endpoint

Test API endpoint trực tiếp:

```bash
curl -X POST https://website-tutor-student-s8rl.vercel.app/api/conversations/[conversationId]/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [token]" \
  -d '{"content":"Test message"}'
```

### Step 2: Check Vercel Logs

1. Vào Vercel Dashboard
2. Chọn project
3. Vào tab **"Logs"**
4. Xem lỗi chi tiết

### Step 3: Check Browser Console

1. Mở browser console (F12)
2. Xem lỗi chi tiết
3. Check Network tab để xem request/response

## 📝 Checklist

- [ ] API route được rewrite đúng trong `vercel.json`
- [ ] CORS được cấu hình đúng
- [ ] Authentication token được gửi đúng
- [ ] API endpoint tồn tại và hoạt động
- [ ] Browser console không có lỗi
- [ ] Network tab hiển thị request đúng
- [ ] Vercel logs không có lỗi

## 🔍 Quick Fix

### Fix 1: Update vercel.json

Đảm bảo `vercel.json` có rewrite đúng:

```json
{
  "functions": {
    "api/index.ts": {
      "memory": 2048,
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Fix 2: Update CORS

Đảm bảo CORS cho phép tất cả origins trong production:

```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? '*' : config.frontend.url,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Fix 3: Add Error Handling

Thêm error handling tốt hơn trong `useLongPolling.ts`:

```typescript
catch (error: any) {
  console.error('[useLongPolling] Send message error:', error);
  if (error.message === 'Failed to fetch') {
    throw new Error('Cannot connect to server. Please check your connection.');
  }
  throw error;
}
```

## ✅ Test Sau Khi Fix

1. Deploy lại lên Vercel
2. Test gửi tin nhắn
3. Kiểm tra browser console
4. Kiểm tra network tab
5. Kiểm tra Vercel logs

## 📚 Tài Liệu Tham Khảo

- `vercel.json` - Vercel configuration
- `server.ts` - API server
- `src/hooks/useLongPolling.ts` - Long polling hook
- `src/lib/api.ts` - API client

