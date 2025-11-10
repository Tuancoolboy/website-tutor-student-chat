# Hướng Dẫn Lấy BLOB_READ_WRITE_TOKEN Từ Vercel Dashboard

## ✅ Blob Store Đã Tạo

- ✅ Tên: `website-tutor-student-blob`
- ✅ Region: `SIN1` (Singapore)
- ✅ Đã có 13 Advanced Operations (không sao, Pro trial có limit cao hơn)

## 🔑 Cách Lấy Token

### Bước 1: Vào Blob Store Settings

1. Vào: https://vercel.com/dashboard
2. Chọn project: `tutor-student` (hoặc tên project của bạn)
3. Vào **Storage** → **Blob**
4. Click vào Blob Store: `website-tutor-student-blob`
5. Click tab **Settings** (icon bánh răng ở góc trên bên phải)

### Bước 2: Lấy Token

Trong tab **Settings**, bạn sẽ thấy:

**Option 1: Environment Variables**
- Tìm phần **Environment Variables**
- Sẽ có `BLOB_READ_WRITE_TOKEN` với value là token
- Copy token đó

**Option 2: Tokens Section**
- Tìm phần **Tokens** hoặc **API Tokens**
- Click **Generate Token** hoặc **View Token**
- Copy token

**Option 3: Từ Project Settings (Dễ nhất)**

1. Vào **Project Settings** (icon bánh răng ở project level)
2. Vào **Environment Variables**
3. Tìm `BLOB_READ_WRITE_TOKEN`
4. Nếu chưa có, click **Add New**:
   - Key: `BLOB_READ_WRITE_TOKEN`
   - Value: (Vercel sẽ tự động generate khi bạn tạo Blob Store)
   - Environment: Tất cả (Production, Preview, Development)
5. Copy value của token

## 🔍 Nếu Không Thấy Token

### Cách 1: Tạo Token Mới

1. Vào Blob Store → **Settings**
2. Tìm phần **Tokens** hoặc **API Tokens**
3. Click **Generate New Token** hoặc **Create Token**
4. Copy token mới

### Cách 2: Dùng Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# List environment variables
vercel env ls

# Add token (sẽ prompt bạn nhập token)
vercel env add BLOB_READ_WRITE_TOKEN
```

### Cách 3: Từ Vercel Dashboard → Project → Settings → Environment Variables

1. Vào **Project Settings** → **Environment Variables**
2. Click **Add New**
3. Key: `BLOB_READ_WRITE_TOKEN`
4. Value: (Để trống - Vercel sẽ tự động generate)
5. Hoặc paste token nếu bạn đã có

## ✅ Sau Khi Có Token

### Bước 1: Test Token (Local)

```bash
BLOB_READ_WRITE_TOKEN=token-cua-ban npm run test:blob
```

### Bước 2: Upload Files (Nếu Token Hợp Lệ)

```bash
BLOB_READ_WRITE_TOKEN=token-cua-ban npm run upload:blob
```

### Bước 3: Set Token trên Vercel (Quan Trọng!)

1. Vào **Project Settings** → **Environment Variables**
2. **Add New** hoặc **Edit**:
   - Key: `BLOB_READ_WRITE_TOKEN`
   - Value: Token bạn vừa copy
   - Environment: Tất cả (Production, Preview, Development)
3. **Save**

### Bước 4: Redeploy Vercel

1. Vào **Deployments**
2. Click **Redeploy** trên deployment mới nhất
3. Đợi deploy hoàn thành

## 📝 Lưu Ý

- ✅ Token phải có prefix: `vercel_blob_rw_`
- ✅ Token thường có 100+ ký tự
- ✅ Copy TOÀN BỘ token (không bỏ sót ký tự nào)
- ✅ Set token trên Vercel environment variables (không chỉ local .env)
- ✅ Token sẽ được dùng khi Vercel deploy (không cần set local nếu chỉ deploy)

## 🎯 Quick Check

Sau khi set token trên Vercel:

1. Vào **Deployments** → Chọn deployment mới nhất → **Logs**
2. Tìm: `[Storage] Using Vercel Blob Storage (BLOB_READ_WRITE_TOKEN found)`
3. ✅ Nếu thấy → Token đã được set đúng!

