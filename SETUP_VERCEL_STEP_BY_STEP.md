# Hướng Dẫn Setup Vercel Từ Đầu - Step by Step

## ✅ Tình Trạng

- ✅ Đã có Vercel Pro trial
- ✅ Đã deploy code: https://website-tutor-student-mu.vercel.app/
- ✅ Code đã push lên GitHub

## 🚀 Bước 1: Lấy BLOB_READ_WRITE_TOKEN

### Cách 1: Từ Vercel Dashboard (Khuyến nghị)

1. Vào: https://vercel.com/dashboard
2. Chọn project: `tutor-student` (hoặc tên project của bạn)
3. Vào **Storage** → **Blob**
4. **Nếu chưa có store:**
   - Click **Create Blob Store**
   - Đặt tên: `tutor-student`
   - Chọn region: `Singapore (sin1)` (hoặc region gần nhất)
   - Click **Create**
5. **Lấy token:**
   - Vào **Settings** (icon bánh răng) của Blob Store
   - Tìm phần **Environment Variables** hoặc **Tokens**
   - Copy **BLOB_READ_WRITE_TOKEN** (dạng: `vercel_blob_rw_xxxxx...`)
   - **Lưu ý**: Copy TOÀN BỘ token (không bỏ sót ký tự nào)

### Cách 2: Từ Vercel Project Settings

1. Vào **Project Settings** → **Environment Variables**
2. Nếu đã có `BLOB_READ_WRITE_TOKEN`, copy value
3. Nếu chưa có, sẽ tạo ở bước tiếp theo

### ✅ Test Token (Quan trọng!)

Sau khi có token, test xem token có hợp lệ không:

```bash
BLOB_READ_WRITE_TOKEN=your-token-here npx tsx scripts/test-blob-token.ts
```

Nếu thấy "✅ Token is valid!" → Token đúng!
Nếu thấy "❌ Token is invalid" → Làm lại bước 1

## 🚀 Bước 2: Set Environment Variables

1. Vào **Project Settings** → **Environment Variables**
2. Click **Add New**
3. Thêm từng biến sau:

### Biến 1: BLOB_READ_WRITE_TOKEN
- **Key**: `BLOB_READ_WRITE_TOKEN`
- **Value**: Token bạn vừa copy
- **Environment**: Chọn tất cả (Production, Preview, Development)

### Biến 2: JWT_SECRET
- **Key**: `JWT_SECRET`
- **Value**: `tutor-support-system-secret-key-2025-min-32-chars` (hoặc random string dài 32+ ký tự)
- **Environment**: Chọn tất cả

### Biến 3: FRONTEND_URL
- **Key**: `FRONTEND_URL`
- **Value**: `https://website-tutor-student-mu.vercel.app`
- **Environment**: Chọn tất cả

### Biến 4: NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`
- **Environment**: Chọn Production

## 🚀 Bước 3: Upload Files Lên Blob Storage

### Cách 1: Dùng Script (Khuyến nghị)

1. Mở terminal
2. Chạy lệnh:
```bash
cd /Users/vuhaituan/Downloads/hcmut-tutor-master2
export BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx  # Thay bằng token thực tế
npx tsx scripts/upload-to-blob.ts
```

Script sẽ upload tất cả 22 files từ `data/` folder lên Blob Storage.

### Cách 2: Upload Thủ Công (Nếu script không hoạt động)

1. Vào Vercel Dashboard → Storage → Blob
2. Click **Upload** cho từng file trong `data/` folder
3. Đảm bảo set `access: 'public'` cho mỗi file

## 🚀 Bước 4: Redeploy Vercel

Sau khi set environment variables:

1. Vào **Deployments** tab
2. Click **⋯** (3 chấm) trên deployment mới nhất
3. Chọn **Redeploy**
4. Đợi deployment hoàn thành (2-5 phút)

## 🚀 Bước 5: Kiểm Tra

### 5.1. Kiểm Tra Logs

1. Vào **Deployments** → Chọn deployment mới nhất
2. Click **Logs**
3. Tìm các dòng sau:
   ```
   [Storage] Using Vercel Blob Storage (BLOB_READ_WRITE_TOKEN found)
   [Blob Storage] Found and cached URL for data/users.json
   ```
   ✅ Nếu thấy → Blob Storage đang hoạt động!

### 5.2. Test Health Check

Mở browser hoặc terminal:
```bash
curl https://website-tutor-student-mu.vercel.app/api/health
```

Nên trả về:
```json
{"success":true,"message":"Server is running","timestamp":"2024-..."}
```

### 5.3. Test Đăng Nhập

```bash
curl -X POST https://website-tutor-student-mu.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@hcmut.edu.vn","password":"password123"}'
```

Nên trả về token và user info.

## 🚀 Bước 6: Kiểm Tra Frontend

1. Mở: https://website-tutor-student-mu.vercel.app/
2. Thử đăng nhập
3. Nếu lỗi, kiểm tra browser console (F12)

## 📝 Checklist

- [ ] Lấy BLOB_READ_WRITE_TOKEN từ Vercel Dashboard
- [ ] Set environment variables:
  - [ ] BLOB_READ_WRITE_TOKEN
  - [ ] JWT_SECRET
  - [ ] FRONTEND_URL
  - [ ] NODE_ENV=production
- [ ] Upload files lên Blob Storage (scripts/upload-to-blob.ts)
- [ ] Redeploy Vercel project
- [ ] Kiểm tra logs (Blob Storage đang hoạt động)
- [ ] Test API health check
- [ ] Test đăng nhập
- [ ] Test frontend đăng nhập

## 🎉 Kết Quả

Sau khi hoàn thành:
- ✅ Backend chạy trên Vercel với Blob Storage
- ✅ Frontend chạy trên Vercel
- ✅ Database files đã được upload lên Blob Storage
- ✅ Đăng nhập hoạt động bình thường
- ✅ Không còn lỗi 403 Forbidden

## 🔧 Troubleshooting

### Lỗi: "BLOB_READ_WRITE_TOKEN is not set"
**Giải pháp**: Set `BLOB_READ_WRITE_TOKEN` trong Vercel environment variables và redeploy

### Lỗi: "No blob found for users.json"
**Giải pháp**: Chạy `npx tsx scripts/upload-to-blob.ts` để upload files

### Lỗi: "403 Forbidden"
**Giải pháp**: 
1. Đảm bảo files được upload với `access: 'public'`
2. Kiểm tra token có đúng không
3. Redeploy Vercel project

### Frontend không kết nối được API
**Giải pháp**: 
1. Kiểm tra `vercel.json` có rewrite rules đúng không
2. Kiểm tra `api/index.ts` có export app không
3. Redeploy frontend

