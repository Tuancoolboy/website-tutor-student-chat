# Fix Vercel Blob Storage Error (EROFS)

## 🔴 Lỗi

```
Không thể gửi tin nhắn: Lỗi gửi tin nhắn: EROFS: read-only file system, open '/var/task/data/messages.json
```

## 📋 Nguyên Nhân

Vercel serverless functions có **read-only file system**. Không thể ghi file vào `/var/task/data/`.

Code đang cố ghi file local thay vì dùng Vercel Blob Storage.

## ✅ Giải Pháp

### Bước 1: Lấy Vercel Blob Storage Token

1. Vào **Vercel Dashboard** → Project của bạn
2. Vào **Settings** → **Storage**
3. Click **Create Database** → Chọn **Blob**
4. Sau khi tạo, copy **BLOB_READ_WRITE_TOKEN**

Hoặc nếu đã có Blob Storage:

1. Vào **Settings** → **Storage**
2. Click vào Blob Storage của bạn
3. Vào **Settings** → Copy **BLOB_READ_WRITE_TOKEN**

### Bước 2: Thêm Environment Variable vào Vercel

1. Vào **Vercel Dashboard** → Project → **Settings** → **Environment Variables**
2. Thêm biến mới:
   - **Key:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** Token bạn vừa copy (bắt đầu với `vercel_blob_rw_...`)
   - **Environment:** Chọn **Production, Preview, Development** (tất cả)

### Bước 3: Redeploy

1. Vào **Deployments** tab
2. Click **Redeploy** trên deployment mới nhất
3. Hoặc push code mới lên GitHub (tự động deploy)

## 🔍 Kiểm Tra

Sau khi deploy, kiểm tra:

1. Vào **Functions** tab trong Vercel Dashboard
2. Xem logs của function `/api/messages/send`
3. Nếu thấy log `⚠️ WARNING: Running on Vercel but BLOB_READ_WRITE_TOKEN is not set!` → Token chưa được set
4. Nếu không thấy warning → Token đã được set đúng

## 🧪 Test

1. Mở website trên Vercel
2. Đăng nhập
3. Gửi tin nhắn
4. Nếu thành công → ✅ Fixed!
5. Nếu vẫn lỗi → Kiểm tra lại token và redeploy

## 📝 Lưu Ý

### Code Đã Được Cập Nhật

File `lib/storage.ts` đã được cập nhật để:
- ✅ Tự động detect Vercel và force dùng Blob Storage
- ✅ Hiển thị warning nếu thiếu token
- ✅ Throw error rõ ràng nếu cố ghi file trên Vercel

### Vercel Blob Storage

- ✅ **Free tier:** 1 GB storage, 1 GB bandwidth/month
- ✅ **Pricing:** $0.15/GB storage, $0.15/GB bandwidth
- ✅ **Perfect for:** JSON files, small files, temporary storage

### Alternative: Database

Nếu cần database thật (không phải JSON files), có thể dùng:
- **Vercel Postgres** (free tier: 256 MB)
- **Vercel KV** (Redis, free tier: 256 MB)
- **External database** (MongoDB Atlas, Supabase, etc.)

## 🚀 Next Steps

1. ✅ Set `BLOB_READ_WRITE_TOKEN` trong Vercel
2. ✅ Redeploy
3. ✅ Test gửi tin nhắn
4. ✅ Verify data được lưu vào Blob Storage

## 📚 Tài Liệu

- [Vercel Blob Storage Docs](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

