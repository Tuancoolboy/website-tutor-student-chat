# 🔧 Token Bị Lỗi - Giải Pháp

## ❌ Lỗi Hiện Tại

Token bạn cung cấp: `vercel_blob_rw_qiNMQJKj9B7ZTJBU_rS8uCHJM0igOPP7FqjGYMno2nUP0ELg`

**Lỗi**: `Access denied, please provide a valid token for this resource`

## 🔍 Nguyên Nhân

1. Token không đúng (thiếu ký tự hoặc sai)
2. Token không có quyền read/write
3. Blob Store chưa được tạo
4. Token không match với Blob Store

## ✅ Giải Pháp

### Bước 1: Kiểm Tra Token trên Vercel Dashboard

1. Vào: https://vercel.com/dashboard
2. Chọn project: `tutor-student` (hoặc tên project của bạn)
3. Vào **Storage** → **Blob**
4. Kiểm tra xem có Blob Store nào không

### Bước 2: Tạo Blob Store Mới (Nếu Chưa Có)

1. Click **Create Blob Store**
2. Đặt tên: `tutor-student`
3. Chọn region: `Singapore (sin1)`
4. Click **Create**

### Bước 3: Lấy Token Mới

**Cách 1: Từ Blob Store Settings**

1. Vào Blob Store vừa tạo
2. Click **Settings** (icon bánh răng)
3. Tìm phần **Environment Variables** hoặc **Tokens**
4. Copy **BLOB_READ_WRITE_TOKEN** mới

**Cách 2: Từ Project Settings**

1. Vào **Project Settings** → **Environment Variables**
2. Vercel có thể tự động tạo token khi bạn tạo Blob Store
3. Tìm `BLOB_READ_WRITE_TOKEN` và copy value

### Bước 4: Test Token Mới

```bash
# Test token mới
BLOB_READ_WRITE_TOKEN=token-moi-cua-ban npx tsx scripts/test-blob-token.ts
```

Nếu thấy "✅ Token is valid!" → Token đúng!

### Bước 5: Upload Files

```bash
# Upload files với token mới
BLOB_READ_WRITE_TOKEN=token-moi-cua-ban npm run upload:blob
```

### Bước 6: Set Token trên Vercel

1. Vào **Project Settings** → **Environment Variables**
2. **Add New** hoặc **Edit**:
   - Key: `BLOB_READ_WRITE_TOKEN`
   - Value: Token mới
   - Environment: Tất cả (Production, Preview, Development)
3. **Save**

### Bước 7: Redeploy Vercel

1. Vào **Deployments**
2. Click **Redeploy** trên deployment mới nhất
3. Đợi deploy hoàn thành

## 💡 Lưu Ý Quan Trọng

1. **Token phải có prefix**: `vercel_blob_rw_`
2. **Token phải đủ dài**: Thường có 100+ ký tự
3. **Copy TOÀN BỘ token**: Không bỏ sót ký tự nào
4. **Token phải match với Blob Store**: Mỗi Blob Store có token riêng

## 🔄 Nếu Vẫn Không Được

### Option 1: Tạo Blob Store Mới

1. Xóa Blob Store cũ (nếu có)
2. Tạo Blob Store mới
3. Lấy token mới
4. Test và upload files

### Option 2: Dùng Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Set token
vercel env add BLOB_READ_WRITE_TOKEN
```

### Option 3: Set Token Trực Tiếp Trên Vercel

1. Vào **Project Settings** → **Environment Variables**
2. **Add New**:
   - Key: `BLOB_READ_WRITE_TOKEN`
   - Value: (để trống hoặc paste token)
   - Vercel sẽ tự động generate token khi bạn tạo Blob Store

## 📞 Cần Hỗ Trợ?

Nếu vẫn không được, kiểm tra:
1. Vercel account có Pro trial không?
2. Blob Store đã được tạo chưa?
3. Token có đúng format không?
4. Có lỗi gì trong Vercel Dashboard không?

