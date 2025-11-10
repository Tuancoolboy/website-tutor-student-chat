# Hướng Dẫn Setup Vercel Từ Đầu (Pro Trial)

## ✅ Tình Trạng Hiện Tại

- ✅ Đã có Vercel Pro trial
- ✅ Đã deploy code lên Vercel
- ✅ Frontend URL: https://website-tutor-student-mu.vercel.app/
- ✅ Code đã push lên GitHub (commit 2ca6c0a)

## 🚀 Bước 1: Lấy BLOB_READ_WRITE_TOKEN

1. Vào **Vercel Dashboard**: https://vercel.com/dashboard
2. Chọn project: `tutor-student` (hoặc tên project của bạn)
3. Vào **Storage** → **Blob**
4. Click **Create Blob Store** (nếu chưa có) hoặc chọn store hiện có
5. Copy **BLOB_READ_WRITE_TOKEN**

## 🚀 Bước 2: Set Environment Variables Trên Vercel

1. Vào **Project Settings** → **Environment Variables**
2. Thêm các biến sau:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx (token bạn vừa copy)
JWT_SECRET=your-secret-key-min-32-characters
FRONTEND_URL=https://website-tutor-student-mu.vercel.app
NODE_ENV=production
```

**Lưu ý:**
- ✅ **Bắt buộc**: `BLOB_READ_WRITE_TOKEN` (để dùng Blob Storage)
- ✅ **Bắt buộc**: `JWT_SECRET` (ít nhất 32 ký tự)
- ✅ **Không set** `USE_LOCAL_STORAGE` (để dùng Blob Storage)
- ✅ Set cho cả **Production**, **Preview**, và **Development**

## 🚀 Bước 3: Re-upload Files Lên Blob Storage

### Cách 1: Dùng Script (Khuyến nghị)

```bash
# Set token
export BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx

# Run upload script
npx tsx scripts/upload-to-blob.ts
```

Script sẽ upload tất cả files từ `data/` folder lên Blob Storage với `access: 'public'`.

### Cách 2: Upload Thủ Công

1. Vào **Vercel Dashboard** → **Storage** → **Blob**
2. Click **Upload** cho từng file
3. Đảm bảo set `access: 'public'` cho mỗi file

## 🚀 Bước 4: Redeploy Vercel

Sau khi set environment variables:

1. Vào **Deployments** tab
2. Click **Redeploy** trên deployment mới nhất
3. Hoặc push commit mới lên GitHub (Vercel sẽ auto-deploy)

## 🚀 Bước 5: Kiểm Tra Logs

1. Vào **Deployments** → Chọn deployment mới nhất → **Logs**
2. Tìm các log sau:
   - `[Storage] Using Vercel Blob Storage (BLOB_READ_WRITE_TOKEN found)`
   - `[Blob Storage] Found and cached URL for data/users.json`
   - ✅ Nếu thấy → Blob Storage đang hoạt động

## 🚀 Bước 6: Test API

### Test Health Check:
```bash
curl https://website-tutor-student-mu.vercel.app/api/health
```

Nên trả về:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-..."
}
```

### Test Đăng Nhập:
```bash
curl -X POST https://website-tutor-student-mu.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student1@hcmut.edu.vn",
    "password": "password123"
  }'
```

Nên trả về token và user info.

## 🚀 Bước 7: Cấu Hình Frontend

1. Vào **Vercel Dashboard** → **Project Settings** → **Environment Variables**
2. Thêm (cho frontend):
   ```
   VITE_API_URL=https://website-tutor-student-mu.vercel.app
   ```
3. Redeploy frontend

## 📝 Checklist

- [ ] Lấy BLOB_READ_WRITE_TOKEN từ Vercel Dashboard
- [ ] Set environment variables trên Vercel:
  - [ ] BLOB_READ_WRITE_TOKEN
  - [ ] JWT_SECRET
  - [ ] FRONTEND_URL
  - [ ] NODE_ENV=production
- [ ] Re-upload files lên Blob Storage (scripts/upload-to-blob.ts)
- [ ] Redeploy Vercel project
- [ ] Kiểm tra logs (Blob Storage đang hoạt động)
- [ ] Test API health check
- [ ] Test đăng nhập
- [ ] Cấu hình frontend API URL
- [ ] Test toàn bộ ứng dụng

## 🎉 Kết Quả

Sau khi hoàn thành:
- ✅ Backend chạy trên Vercel với Blob Storage
- ✅ Frontend chạy trên Vercel
- ✅ Database files đã được upload lên Blob Storage
- ✅ Đăng nhập hoạt động bình thường
- ✅ Không còn lỗi 403 Forbidden (vì đã có Pro trial)

## 🔧 Troubleshooting

### Lỗi: "BLOB_READ_WRITE_TOKEN is not set"
- **Giải pháp**: Set `BLOB_READ_WRITE_TOKEN` trong Vercel environment variables

### Lỗi: "No blob found for users.json"
- **Giải pháp**: Chạy `npx tsx scripts/upload-to-blob.ts` để upload files

### Lỗi: "403 Forbidden"
- **Giải pháp**: 
  1. Đảm bảo files được upload với `access: 'public'`
  2. Kiểm tra token có đúng không
  3. Redeploy Vercel project

### Lỗi: "Store is blocked"
- **Giải pháp**: Với Pro trial, không bị block. Nếu vẫn bị, kiểm tra usage limits.

## 📌 Lưu Ý

- ✅ Với Pro trial, Advanced Operations limit cao hơn (không bị block)
- ✅ Blob Storage hoạt động tốt với Pro plan
- ✅ Code đã được tối ưu với cache URLs (giảm operations)
- ✅ Files được upload với `access: 'public'` (có thể đọc không cần token)

