# Hướng Dẫn Lấy BLOB_READ_WRITE_TOKEN Đúng Cách

## ⚠️ Lỗi: "Access denied, please provide a valid token"

Nếu gặp lỗi này, có thể do:
1. Token không đúng
2. Token không có quyền read/write
3. Blob Store chưa được tạo
4. Token không match với Blob Store

## 🔍 Cách Lấy Token Đúng

### Bước 1: Vào Vercel Dashboard

1. Truy cập: https://vercel.com/dashboard
2. Đăng nhập vào tài khoản của bạn

### Bước 2: Chọn Project

1. Tìm và click vào project: `tutor-student` (hoặc tên project của bạn)
2. Vào **Settings** (icon bánh răng) → **Storage**

### Bước 3: Tạo Blob Store (Nếu Chưa Có)

1. Nếu chưa có Blob Store, click **Create Blob Store**
2. Đặt tên: `tutor-student` (hoặc tên bạn muốn)
3. Chọn region: `Singapore (sin1)` (hoặc region gần nhất)
4. Click **Create**

### Bước 4: Lấy Token

1. Sau khi tạo Blob Store, vào tab **Settings**
2. Tìm phần **Environment Variables** hoặc **Tokens**
3. Copy **BLOB_READ_WRITE_TOKEN** (dạng: `vercel_blob_rw_xxxxx...`)
4. **Lưu ý**: Copy TOÀN BỘ token (không bỏ sót ký tự nào)

### Bước 5: Set Token trong Environment Variables

1. Vào **Project Settings** → **Environment Variables**
2. Click **Add New**
3. **Key**: `BLOB_READ_WRITE_TOKEN`
4. **Value**: Token bạn vừa copy
5. **Environment**: Chọn tất cả (Production, Preview, Development)
6. Click **Save**

## ✅ Test Token

Sau khi có token, test xem token có hợp lệ không:

```bash
BLOB_READ_WRITE_TOKEN=your-token-here npx tsx scripts/test-blob-token.ts
```

Nếu thấy "✅ Token is valid!" → Token đúng!

## 📤 Upload Files

Sau khi token hợp lệ, upload files:

```bash
BLOB_READ_WRITE_TOKEN=your-token-here npm run upload:blob
```

## 🔧 Troubleshooting

### Lỗi: "Access denied"
- **Giải pháp**: Kiểm tra lại token có đúng không
- **Giải pháp**: Đảm bảo token có quyền "read" và "write"
- **Giải pháp**: Tạo Blob Store mới và lấy token mới

### Lỗi: "Store not found"
- **Giải pháp**: Tạo Blob Store trong Vercel Dashboard
- **Giải pháp**: Đảm bảo token match với Blob Store

### Lỗi: "Token expired"
- **Giải pháp**: Tạo token mới trong Vercel Dashboard
- **Giải pháp**: Copy token mới và set lại trong environment variables

## 💡 Lưu Ý

- ✅ Token phải có prefix `vercel_blob_rw_`
- ✅ Token phải có đủ quyền read và write
- ✅ Token phải match với Blob Store bạn muốn dùng
- ✅ Set token trong Vercel environment variables (không chỉ trong local .env)

