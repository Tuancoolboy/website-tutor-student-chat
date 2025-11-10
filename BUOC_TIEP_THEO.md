# 🚀 Bước Tiếp Theo - Setup Vercel Blob Storage

## ✅ Đã Hoàn Thành

- ✅ Đã tạo Blob Store: `website-tutor-student-blob`
- ✅ Region: SIN1 (Singapore)
- ✅ Pro trial đang active

## 📋 Checklist Các Bước

### Bước 1: Lấy BLOB_READ_WRITE_TOKEN ⏳

**Cách nhanh nhất:**

1. Vào: https://vercel.com/dashboard
2. Chọn project → **Settings** → **Environment Variables**
3. Tìm `BLOB_READ_WRITE_TOKEN`
4. **Nếu chưa có**: Click **Add New** → Key: `BLOB_READ_WRITE_TOKEN` → Save (Vercel sẽ auto-generate)
5. **Copy token** (toàn bộ, không bỏ sót ký tự)

### Bước 2: Test Token (Tùy Chọn) ⏳

```bash
BLOB_READ_WRITE_TOKEN=token-cua-ban npm run test:blob
```

Nếu thấy "✅ Token is valid!" → Token đúng!

### Bước 3: Upload Files (Tùy Chọn) ⏳

```bash
BLOB_READ_WRITE_TOKEN=token-cua-ban npm run upload:blob
```

Sẽ upload 22 files từ `data/` folder lên Blob Storage.

### Bước 4: Set Environment Variables trên Vercel ⏳

Vào **Project Settings** → **Environment Variables**, thêm:

```
BLOB_READ_WRITE_TOKEN=token-cua-ban (token bạn vừa copy)
JWT_SECRET=tutor-support-system-secret-key-2025-min-32-chars
FRONTEND_URL=https://website-tutor-student-mu.vercel.app
NODE_ENV=production
```

**Lưu ý**: Chọn tất cả environments (Production, Preview, Development)

### Bước 5: Redeploy Vercel ⏳

1. Vào **Deployments**
2. Click **Redeploy** trên deployment mới nhất
3. Đợi deploy hoàn thành (2-5 phút)

### Bước 6: Kiểm Tra ⏳

1. **Kiểm tra logs**:
   - Vào **Deployments** → Chọn deployment mới nhất → **Logs**
   - Tìm: `[Storage] Using Vercel Blob Storage (BLOB_READ_WRITE_TOKEN found)`
   - ✅ Nếu thấy → Token đã được set đúng!

2. **Test API**:
   ```bash
   curl https://website-tutor-student-mu.vercel.app/api/health
   ```

3. **Test đăng nhập**:
   - Mở: https://website-tutor-student-mu.vercel.app/
   - Thử đăng nhập với tài khoản test

## 🎯 Bắt Đầu Từ Đâu?

### Nếu Bạn Đang Ở Bước 1 (Lấy Token):

1. Vào Vercel Dashboard
2. Project Settings → Environment Variables
3. Tìm hoặc tạo `BLOB_READ_WRITE_TOKEN`
4. Copy token
5. Làm tiếp Bước 4 (Set trên Vercel)

### Nếu Đã Có Token:

1. Test token: `BLOB_READ_WRITE_TOKEN=token npm run test:blob`
2. Upload files: `BLOB_READ_WRITE_TOKEN=token npm run upload:blob`
3. Set token trên Vercel (Bước 4)
4. Redeploy Vercel (Bước 5)
5. Kiểm tra (Bước 6)

## 📚 Tài Liệu Tham Khảo

- `CACH_LAY_TOKEN_BLOB.md` - Hướng dẫn chi tiết cách lấy token
- `QUICK_START_VERCEL.md` - Hướng dẫn nhanh setup Vercel
- `SETUP_VERCEL_STEP_BY_STEP.md` - Hướng dẫn từng bước chi tiết

## 🆘 Nếu Gặp Lỗi

### Lỗi: "Token is invalid"
- Kiểm tra token có đúng không
- Copy TOÀN BỘ token (không bỏ sót ký tự)
- Tạo token mới nếu cần

### Lỗi: "Access denied"
- Kiểm tra token có quyền read/write không
- Đảm bảo Blob Store đã được tạo
- Tạo token mới nếu cần

### Lỗi: "No blob found"
- Upload files lên Blob Storage (Bước 3)
- Kiểm tra files đã được upload chưa: `npm run check:blob`

## ✅ Kết Quả Mong Đợi

Sau khi hoàn thành tất cả các bước:

- ✅ Backend chạy trên Vercel
- ✅ Blob Storage hoạt động
- ✅ Database files đã được upload (nếu bạn upload)
- ✅ Đăng nhập hoạt động
- ✅ Không còn lỗi 403 Forbidden

## 🎉 Bắt Đầu Ngay!

Bắt đầu từ **Bước 1: Lấy BLOB_READ_WRITE_TOKEN**

Vào Vercel Dashboard → Project Settings → Environment Variables → Tìm hoặc tạo `BLOB_READ_WRITE_TOKEN` → Copy token!

