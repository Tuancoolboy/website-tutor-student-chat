# Hướng Dẫn Deploy Lên Render (Không Dùng Blob Storage)

## 🎯 Mục Đích

Deploy ứng dụng lên Render để sử dụng **local file system** thay vì Vercel Blob Storage (đã bị block do vượt quá giới hạn).

## ✅ Lợi Ích

- ✅ **Không giới hạn** Advanced Operations
- ✅ **Miễn phí** với Render free tier
- ✅ **Local storage** - không cần Blob Storage
- ✅ **Không bị block** do usage limits

## 📋 Bước 1: Tạo Tài Khoản Render

1. Truy cập: https://render.com
2. Đăng ký/Đăng nhập bằng GitHub
3. Kết nối GitHub account

## 📋 Bước 2: Tạo Web Service

1. Vào **Dashboard** → Click **New +** → Chọn **Web Service**
2. **Connect repository**: Chọn repository `Website-tutor-student`
3. **Configure service**:
   - **Name**: `tutor-student-api` (hoặc tên bạn muốn)
   - **Region**: Singapore (SIN) hoặc gần nhất
   - **Branch**: `main`
   - **Root Directory**: (để trống)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run api`

## 📋 Bước 3: Cấu Hình Environment Variables

### Nếu dùng render.yaml:
- `USE_LOCAL_STORAGE=true` đã được set tự động
- `JWT_SECRET` sẽ được generate tự động
- Chỉ cần set thêm: `FRONTEND_URL`

### Nếu tạo thủ công:
Trong **Environment Variables** section, thêm:

```
NODE_ENV=production
USE_LOCAL_STORAGE=true
FRONTEND_URL=https://your-frontend-url.vercel.app
JWT_SECRET=your-secret-key-here-min-32-chars
```

**Lưu ý quan trọng:**
- ✅ **KHÔNG set** `BLOB_READ_WRITE_TOKEN` (để dùng local storage)
- ✅ **Bắt buộc**: `USE_LOCAL_STORAGE=true` (để dùng local storage)
- ✅ **KHÔNG set** `PORT` (Render tự động set PORT)
- ✅ **Set** `FRONTEND_URL` (URL của frontend để CORS)

## 📋 Bước 4: Cấu Hình Build & Deploy

### Nếu dùng render.yaml:
- Build & Start commands đã được cấu hình tự động
- Không cần set thêm

### Nếu tạo thủ công:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run api
```

**Lưu ý:**
- Render sẽ tự động set `PORT` environment variable
- Code sẽ tự động dùng `process.env.PORT` (đã có trong config)

## 📋 Bước 5: Deploy

1. Click **Create Web Service**
2. Render sẽ tự động:
   - Clone code từ GitHub
   - Install dependencies
   - Build project
   - Start server
3. Đợi deployment hoàn thành (5-10 phút)

## 📋 Bước 6: Tạo Database Files (Quan Trọng!)

Sau khi deploy, cần tạo database files (users.json, sessions.json, etc.):

### Cách 1: Seed Data (Khuyến nghị)

1. **SSH vào Render service** (nếu có) hoặc chạy local:
   ```bash
   npm run seed
   ```

2. **Hoặc tạo file thủ công**: Upload các file JSON từ thư mục `data/` lên Render

### Cách 2: Tạo qua API

1. Đăng ký user đầu tiên qua API:
   ```bash
   POST https://your-service-name.onrender.com/api/auth/register
   {
     "email": "admin@hcmut.edu.vn",
     "password": "password123",
     "name": "Admin",
     "role": "management"
   }
   ```

2. File `users.json` sẽ được tạo tự động

## 📋 Bước 7: Kiểm Tra

Sau khi deploy xong:

1. **Kiểm tra logs**: 
   - Vào **Logs** tab
   - Tìm: `[Storage] Using local file system (blob storage disabled via USE_LOCAL_STORAGE=true)`
   - ✅ Nếu thấy → Local storage đang hoạt động

2. **Test API**:
   - URL: `https://your-service-name.onrender.com/health`
   - Nên trả về: `{"success": true, "message": "Server is running"}`

3. **Test đăng nhập**:
   - Gửi POST request đến: `https://your-service-name.onrender.com/api/auth/login`
   - Nên hoạt động bình thường (sau khi đã seed data)

## 🔧 Cấu Hình Frontend

Cập nhật frontend để trỏ đến Render API:

1. **Vercel Environment Variables** (cho frontend):
   ```
   VITE_API_URL=https://your-service-name.onrender.com
   ```

2. **Hoặc trong code**:
   ```typescript
   // src/lib/api.ts
   const API_URL = import.meta.env.VITE_API_URL || 'https://your-service-name.onrender.com';
   ```

## 📊 So Sánh

| | Vercel Blob Storage | Render Local Storage |
|---|---|---|
| **Advanced Operations** | 2k/tháng (đã vượt) | Không giới hạn |
| **Storage** | 1 GB | 512 MB (free) |
| **File System** | Read-only | Read/Write |
| **Chi phí** | Free (có giới hạn) | Free (không giới hạn) |
| **Bị block** | ✅ Đã bị block | ❌ Không bị block |

## ⚠️ Lưu Ý

### 1. Render Free Tier

- **Sleep sau 15 phút** không có traffic
- **Wake up** khi có request (mất ~30 giây)
- **Giải pháp**: Dùng cron job để ping service mỗi 5 phút

### 2. Local Storage

- Data lưu trong file system của Render
- **Persistent** - không mất khi restart
- **Backup**: Nên backup data định kỳ

### 3. Environment Variables

- ✅ **Bắt buộc**: `USE_LOCAL_STORAGE=true`
- ❌ **KHÔNG set**: `BLOB_READ_WRITE_TOKEN`
- ✅ **Nên set**: `JWT_SECRET`, `FRONTEND_URL`

## 🚀 Deploy Frontend (Optional)

Nếu muốn deploy frontend lên Render:

1. Tạo **Static Site** service
2. **Build Command**: `npm install && npm run build`
3. **Publish Directory**: `dist`
4. **Environment Variables**: 
   ```
   VITE_API_URL=https://your-api-service.onrender.com
   ```

## 📝 Checklist

- [ ] Tạo tài khoản Render
- [ ] Tạo Web Service
- [ ] Set environment variables (USE_LOCAL_STORAGE=true)
- [ ] Deploy service
- [ ] Kiểm tra logs (local storage đang hoạt động)
- [ ] Test API endpoint
- [ ] Test đăng nhập
- [ ] Cập nhật frontend API URL
- [ ] Test toàn bộ ứng dụng

## 🎉 Kết Quả

Sau khi deploy:
- ✅ Không còn lỗi 403 Forbidden
- ✅ Không bị block do usage limits
- ✅ Local storage hoạt động bình thường
- ✅ Database files lưu trong file system

## 🔗 Links

- Render Dashboard: https://dashboard.render.com
- Render Docs: https://render.com/docs
- Service URL: `https://your-service-name.onrender.com`

