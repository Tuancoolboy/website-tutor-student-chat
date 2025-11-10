# Quick Start: Setup Vercel Blob Storage

## 🎯 Mục Tiêu

Setup Vercel Blob Storage để lưu database files (users.json, sessions.json, etc.)

## ⚡ Quick Steps (5 phút)

### 1. Lấy Token từ Vercel Dashboard

1. Vào: https://vercel.com/dashboard
2. Chọn project → **Storage** → **Blob**
3. **Create Blob Store** (nếu chưa có) → Đặt tên → Create
4. Vào **Settings** → Copy **BLOB_READ_WRITE_TOKEN**

### 2. Set Token trên Vercel

1. Vào **Project Settings** → **Environment Variables**
2. **Add New**:
   - Key: `BLOB_READ_WRITE_TOKEN`
   - Value: Token vừa copy
   - Environment: Tất cả (Production, Preview, Development)
3. **Save**

### 3. Test Token (Local)

```bash
# Test token
BLOB_READ_WRITE_TOKEN=your-token npx tsx scripts/test-blob-token.ts

# Nếu token hợp lệ, upload files
BLOB_READ_WRITE_TOKEN=your-token npm run upload:blob
```

### 4. Set Các Environment Variables Khác

Trên Vercel Dashboard → **Environment Variables**:

```
JWT_SECRET=tutor-support-system-secret-key-2025-min-32-chars
FRONTEND_URL=https://website-tutor-student-mu.vercel.app
NODE_ENV=production
```

### 5. Redeploy Vercel

1. Vào **Deployments**
2. Click **Redeploy** trên deployment mới nhất
3. Đợi deploy hoàn thành (2-5 phút)

### 6. Test

```bash
# Test API
curl https://website-tutor-student-mu.vercel.app/api/health

# Test đăng nhập
curl -X POST https://website-tutor-student-mu.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@hcmut.edu.vn","password":"password123"}'
```

## ✅ Checklist

- [ ] Tạo Blob Store trên Vercel
- [ ] Lấy BLOB_READ_WRITE_TOKEN
- [ ] Test token (scripts/test-blob-token.ts)
- [ ] Upload files (npm run upload:blob)
- [ ] Set environment variables trên Vercel
- [ ] Redeploy Vercel
- [ ] Test API health check
- [ ] Test đăng nhập

## 🎉 Done!

Sau khi hoàn thành:
- ✅ Backend chạy trên Vercel
- ✅ Blob Storage hoạt động
- ✅ Database files đã được upload
- ✅ Đăng nhập hoạt động

## 🔧 Troubleshooting

### Token không hợp lệ
- Kiểm tra token có đúng không (copy TOÀN BỘ token)
- Đảm bảo Blob Store đã được tạo
- Tạo token mới nếu cần

### Upload thất bại
- Kiểm tra token có quyền read/write không
- Test token trước khi upload
- Xem logs để biết lỗi cụ thể

### 403 Forbidden
- Đảm bảo files được upload với `access: 'public'`
- Kiểm tra token có đúng không
- Redeploy Vercel project

