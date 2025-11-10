# ✅ Checklist Environment Variables trên Vercel

## 📋 Các Environment Variables Cần Thiết

### ✅ Đã Có
- [x] `BLOB_READ_WRITE_TOKEN` = `vercel_blob_rw_qiNMQJKj9B7ZTJBU_...` (đã set)

### ⏳ Cần Thêm
- [ ] `JWT_SECRET` = `tutor-support-system-secret-key-2025-min-32-chars`
- [ ] `FRONTEND_URL` = `https://website-tutor-student-mu.vercel.app`
- [ ] `NODE_ENV` = `production` (chỉ cho Production environment)

## 🔧 Cách Thêm Environment Variables

### Bước 1: Vào Vercel Dashboard

1. Vào: https://vercel.com/dashboard
2. Chọn project: `tutor-student` (hoặc tên project của bạn)
3. Vào **Settings** → **Environment Variables**

### Bước 2: Thêm JWT_SECRET

1. Click **Add New**
2. **Key**: `JWT_SECRET`
3. **Value**: `tutor-support-system-secret-key-2025-min-32-chars`
4. **Environment**: Chọn tất cả (Production, Preview, Development)
5. Click **Save**

### Bước 3: Thêm FRONTEND_URL

1. Click **Add New**
2. **Key**: `FRONTEND_URL`
3. **Value**: `https://website-tutor-student-mu.vercel.app`
4. **Environment**: Chọn tất cả (Production, Preview, Development)
5. Click **Save**

### Bước 4: Thêm NODE_ENV

1. Click **Add New**
2. **Key**: `NODE_ENV`
3. **Value**: `production`
4. **Environment**: Chỉ chọn **Production** (không chọn Preview và Development)
5. Click **Save**

## ✅ Sau Khi Thêm Xong

1. **Redeploy Vercel**:
   - Vào **Deployments** tab
   - Click **Redeploy** trên deployment mới nhất
   - Đợi deploy hoàn thành (2-5 phút)

2. **Kiểm Tra Logs**:
   - Vào **Deployments** → Chọn deployment mới nhất → **Logs**
   - Tìm: `[Storage] Using Vercel Blob Storage (BLOB_READ_WRITE_TOKEN found)`
   - ✅ Nếu thấy → Environment variables đã được load đúng!

3. **Test API**:
   ```bash
   curl https://website-tutor-student-mu.vercel.app/api/health
   ```

## 🎯 Tóm Tắt

Sau khi thêm đầy đủ environment variables:

- ✅ `BLOB_READ_WRITE_TOKEN` (đã có)
- ✅ `JWT_SECRET` (cần thêm)
- ✅ `FRONTEND_URL` (cần thêm)
- ✅ `NODE_ENV` (cần thêm)

**Bước tiếp theo**: Thêm các environment variables còn thiếu và redeploy Vercel!

