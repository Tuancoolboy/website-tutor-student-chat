# 🔑 Cách Lấy BLOB_READ_WRITE_TOKEN Từ Vercel

## ❌ KHÔNG Lấy Từ Local .env

Token **KHÔNG** có trong file `.env` local. Token phải lấy từ **Vercel Dashboard**.

## ✅ Cách Lấy Token (3 Cách)

### Cách 1: Từ Blob Store Settings (Dễ Nhất)

1. **Vào Vercel Dashboard**: https://vercel.com/dashboard
2. **Chọn project**: `tutor-student` (hoặc tên project của bạn)
3. **Vào Storage → Blob**: Click vào `website-tutor-student-blob`
4. **Vào Settings**: Click tab **Settings** (icon bánh răng)
5. **Tìm Token**: 
   - Scroll xuống phần **Environment Variables** hoặc **Tokens**
   - Sẽ thấy `BLOB_READ_WRITE_TOKEN` với value
   - **Copy token đó** (toàn bộ, không bỏ sót ký tự)

### Cách 2: Từ Project Settings (Khuyến Nghị)

1. **Vào Project Settings**: 
   - Click vào project `tutor-student`
   - Click **Settings** (icon bánh răng ở menu bên trái)
2. **Vào Environment Variables**:
   - Click tab **Environment Variables**
3. **Tìm hoặc Tạo Token**:
   - **Nếu đã có** `BLOB_READ_WRITE_TOKEN`: Click vào value để xem và copy
   - **Nếu chưa có**: 
     - Click **Add New**
     - Key: `BLOB_READ_WRITE_TOKEN`
     - Value: (Để trống - Vercel sẽ tự động generate khi bạn có Blob Store)
     - Environment: Chọn tất cả (Production, Preview, Development)
     - Click **Save**
     - Sau đó copy value vừa tạo

### Cách 3: Dùng Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# List environment variables (sẽ hiển thị token)
vercel env ls

# Hoặc pull environment variables về local .env
vercel env pull .env.local
```

Sau đó mở file `.env.local` và tìm `BLOB_READ_WRITE_TOKEN`.

## 📝 Sau Khi Có Token

### Bước 1: Test Token (Local - Tùy Chọn)

Nếu muốn test token trước khi set trên Vercel:

```bash
# Test token
BLOB_READ_WRITE_TOKEN=token-cua-ban npm run test:blob
```

### Bước 2: Upload Files (Local - Tùy Chọn)

Nếu muốn upload files từ local:

```bash
# Upload files
BLOB_READ_WRITE_TOKEN=token-cua-ban npm run upload:blob
```

### Bước 3: Set Token trên Vercel (Bắt Buộc!)

**Quan trọng**: Token phải được set trên Vercel environment variables để Vercel có thể dùng khi deploy!

1. **Vào Project Settings** → **Environment Variables**
2. **Add New** hoặc **Edit**:
   - Key: `BLOB_READ_WRITE_TOKEN`
   - Value: Token bạn vừa copy
   - Environment: Tất cả (Production, Preview, Development)
3. **Save**

### Bước 4: Set Các Environment Variables Khác

Cũng trong **Environment Variables**, thêm:

```
JWT_SECRET=tutor-support-system-secret-key-2025-min-32-chars
FRONTEND_URL=https://website-tutor-student-mu.vercel.app
NODE_ENV=production
```

### Bước 5: Redeploy Vercel

1. Vào **Deployments**
2. Click **Redeploy** trên deployment mới nhất
3. Đợi deploy hoàn thành (2-5 phút)

## ✅ Kiểm Tra Token Đã Được Set

### Cách 1: Kiểm Tra Logs

1. Vào **Deployments** → Chọn deployment mới nhất
2. Click **Logs**
3. Tìm: `[Storage] Using Vercel Blob Storage (BLOB_READ_WRITE_TOKEN found)`
4. ✅ Nếu thấy → Token đã được set đúng!

### Cách 2: Test API

```bash
# Test health check
curl https://website-tutor-student-mu.vercel.app/api/health

# Test đăng nhập
curl -X POST https://website-tutor-student-mu.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@hcmut.edu.vn","password":"password123"}'
```

## 🎯 Tóm Tắt

1. ✅ **Lấy token từ Vercel Dashboard** (không phải local .env)
2. ✅ **Set token trên Vercel Environment Variables** (bắt buộc!)
3. ✅ **Set các environment variables khác** (JWT_SECRET, FRONTEND_URL, etc.)
4. ✅ **Redeploy Vercel**
5. ✅ **Kiểm tra logs** để đảm bảo token đã được set đúng

## 💡 Lưu Ý

- ✅ Token phải có prefix: `vercel_blob_rw_`
- ✅ Token thường có 100+ ký tự
- ✅ Copy TOÀN BỘ token (không bỏ sót ký tự nào)
- ✅ Token phải được set trên Vercel (không chỉ local .env)
- ✅ Sau khi set token, phải redeploy Vercel để áp dụng

## 🔧 Nếu Vẫn Không Thấy Token

1. **Kiểm tra Blob Store đã được tạo chưa**:
   - Vào Storage → Blob
   - Phải thấy `website-tutor-student-blob`

2. **Tạo token mới**:
   - Vào Blob Store → Settings
   - Tìm phần Tokens → Generate New Token

3. **Liên hệ Vercel Support** (nếu vẫn không được)

