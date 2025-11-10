# Hướng Dẫn Deploy Lên Render (Chi Tiết)

## 🎯 Tình Trạng Hiện Tại

- ✅ Frontend đã deploy lên Vercel: https://website-tutor-student-mu.vercel.app/
- ❌ Backend đang dùng Vercel Blob Storage (bị block do vượt quá giới hạn)
- ✅ Code đã push lên GitHub

## 🚀 Giải Pháp: Deploy Backend Lên Render

### Bước 1: Tạo Tài Khoản Render

1. Truy cập: https://render.com
2. Đăng nhập bằng GitHub
3. Authorize Render để truy cập GitHub repositories

### Bước 2: Tạo Web Service (Dùng Blueprint)

1. Vào **Dashboard** → Click **New +** → Chọn **Blueprint**
2. **Connect repository**: Chọn `Website-tutor-student`
3. Render sẽ tự động đọc `render.yaml` và tạo service
4. Click **Apply**

### Bước 3: Cấu Hình Environment Variables

Sau khi tạo service, vào **Environment** tab và set:

```
FRONTEND_URL=https://website-tutor-student-mu.vercel.app
```

**Lưu ý:**
- ✅ `USE_LOCAL_STORAGE=true` đã được set tự động (từ render.yaml)
- ✅ `JWT_SECRET` sẽ được generate tự động
- ❌ **KHÔNG set** `BLOB_READ_WRITE_TOKEN`

### Bước 4: Đợi Deploy

1. Render sẽ tự động:
   - Clone code từ GitHub
   - Install dependencies (`npm install`)
   - Build project (`npm run build`)
   - Start server (`npm run api`)
2. Đợi 5-10 phút để deploy hoàn thành

### Bước 5: Kiểm Tra Logs

Vào **Logs** tab, tìm:
```
[Storage] Using local file system (blob storage disabled via USE_LOCAL_STORAGE=true)
```

✅ Nếu thấy → Local storage đang hoạt động!

### Bước 6: Seed Database

Sau khi deploy, cần tạo database files:

**Cách 1: Chạy seed script (nếu có SSH access)**
```bash
npm run seed
```

**Cách 2: Tạo qua API**
```bash
POST https://your-service-name.onrender.com/api/auth/register
{
  "email": "admin@hcmut.edu.vn",
  "password": "password123",
  "name": "Admin",
  "role": "management"
}
```

**Cách 3: Upload files thủ công**
- Copy các file từ `data/` folder
- Upload lên Render (nếu có file manager)

### Bước 7: Cập Nhật Frontend

Cập nhật Vercel Environment Variables cho frontend:

1. Vào Vercel Dashboard → Project Settings → Environment Variables
2. Thêm:
   ```
   VITE_API_URL=https://your-service-name.onrender.com
   ```
3. Redeploy frontend

### Bước 8: Test

1. **Test API**: `https://your-service-name.onrender.com/health`
2. **Test đăng nhập**: Gửi POST đến `/api/auth/login`
3. **Test frontend**: https://website-tutor-student-mu.vercel.app/

## 📝 Checklist

- [ ] Tạo tài khoản Render
- [ ] Tạo Blueprint từ GitHub repo
- [ ] Set `FRONTEND_URL` environment variable
- [ ] Đợi deploy hoàn thành
- [ ] Kiểm tra logs (local storage đang hoạt động)
- [ ] Seed database (tạo users.json, etc.)
- [ ] Cập nhật frontend API URL
- [ ] Test đăng nhập
- [ ] Test toàn bộ ứng dụng

## 🎉 Kết Quả

Sau khi hoàn thành:
- ✅ Backend chạy trên Render (không bị block)
- ✅ Frontend chạy trên Vercel
- ✅ Local storage hoạt động bình thường
- ✅ Không còn lỗi 403 Forbidden

