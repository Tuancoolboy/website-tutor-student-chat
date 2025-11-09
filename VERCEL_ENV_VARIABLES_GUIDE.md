# Hướng Dẫn Thêm Environment Variables trên Vercel

## 🎯 Vercel Environments

Vercel có 3 environments:

1. **Production** - Branch `main` → `website-tutor-student-s8rl.vercel.app`
2. **Preview** - All unassigned git branches → Preview URLs
3. **Development** - Accessible via CLI → Local development

## ✅ Cách Thêm Environment Variable

### Bước 1: Vào Environment Variables

1. Vào Vercel Dashboard: https://vercel.com
2. Chọn project: `website-tutor-student`
3. Vào **Settings** → **Environment Variables**
4. Click **"Add New"**

### Bước 2: Thêm Variable

#### Variable: VITE_WEBSOCKET_URL

1. **Key:** `VITE_WEBSOCKET_URL`
2. **Value:** `https://website-tutor-student-1.onrender.com`
3. **Environments:** Chọn cả 3:
   - ✅ **Production** (quan trọng nhất)
   - ✅ **Preview** (để test trên preview deployments)
   - ✅ **Development** (nếu cần test local)

4. Click **"Save"**

### Bước 3: (Tùy chọn) Thêm VITE_API_URL

Nếu muốn override API URL:

1. **Key:** `VITE_API_URL`
2. **Value:** `https://website-tutor-student-s8rl.vercel.app/api`
3. **Environments:** 
   - ✅ **Production**
   - ✅ **Preview**
   - ❌ **Development** (để dùng local API khi dev)

4. Click **"Save"**

## 📋 Environment Variables Cần Thêm

### Required (Bắt buộc):

| Key | Value | Production | Preview | Development |
|-----|-------|------------|---------|-------------|
| `VITE_WEBSOCKET_URL` | `https://website-tutor-student-1.onrender.com` | ✅ | ✅ | ✅ |

### Optional (Tùy chọn):

| Key | Value | Production | Preview | Development |
|-----|-------|------------|---------|-------------|
| `VITE_API_URL` | `https://website-tutor-student-s8rl.vercel.app/api` | ✅ | ✅ | ❌ |

## 🔍 Giải Thích Từng Environment

### 1. Production
- **Branch:** `main`
- **Domain:** `website-tutor-student-s8rl.vercel.app`
- **Khi nào dùng:** Production deployment
- **Quan trọng:** ✅ Phải có `VITE_WEBSOCKET_URL`

### 2. Preview
- **Branch:** All unassigned git branches
- **Domain:** Preview URLs (tự động tạo)
- **Khi nào dùng:** Preview deployments (PR, branches)
- **Quan trọng:** ✅ Nên có `VITE_WEBSOCKET_URL` để test

### 3. Development
- **Branch:** Accessible via CLI
- **Domain:** Local development
- **Khi nào dùng:** Local development với `vercel dev`
- **Quan trọng:** ⚠️ Có thể dùng local WebSocket server

## ✅ Checklist

### Environment Variables:
- [ ] `VITE_WEBSOCKET_URL` đã thêm vào **Production**
- [ ] `VITE_WEBSOCKET_URL` đã thêm vào **Preview**
- [ ] `VITE_WEBSOCKET_URL` đã thêm vào **Development** (tùy chọn)
- [ ] Value đúng: `https://website-tutor-student-1.onrender.com`

### Sau Khi Thêm:
- [ ] Vercel tự động redeploy (hoặc manual redeploy)
- [ ] Test Production: `https://website-tutor-student-s8rl.vercel.app`
- [ ] Test WebSocket connection
- [ ] Test Active Now

## 🚀 Sau Khi Thêm Environment Variables

### Option 1: Đợi Tự Động Redeploy
- Vercel sẽ tự động redeploy khi có thay đổi environment variables
- Đợi 2-3 phút

### Option 2: Manual Redeploy
1. Vào Vercel Dashboard
2. Chọn project
3. Vào tab **"Deployments"**
4. Click **"..."** → **"Redeploy"**
5. Chọn environment: **Production**

## 🐛 Troubleshooting

### Lỗi: "Environment variable not found"

**Nguyên nhân:**
- Environment variable chưa được thêm
- Chưa redeploy sau khi thêm

**Giải pháp:**
1. Kiểm tra environment variables trên Vercel
2. Đảm bảo đã chọn đúng environments (Production, Preview)
3. Redeploy project

### Lỗi: "WebSocket connection failed"

**Nguyên nhân:**
- `VITE_WEBSOCKET_URL` không đúng
- WebSocket server chưa start

**Giải pháp:**
1. Kiểm tra `VITE_WEBSOCKET_URL` value
2. Test WebSocket server: `curl https://website-tutor-student-1.onrender.com/health`
3. Kiểm tra Render logs

## 📝 Lưu Ý

1. **Production là quan trọng nhất** - Phải có `VITE_WEBSOCKET_URL`
2. **Preview cũng nên có** - Để test trên preview deployments
3. **Development có thể bỏ qua** - Nếu chỉ dùng local WebSocket server
4. **Sau khi thêm** - Vercel sẽ tự động redeploy (hoặc manual redeploy)

## ✅ Hoàn Thành

Sau khi thêm environment variables:
- ✅ Production deployment sẽ dùng WebSocket URL từ Render
- ✅ Preview deployments sẽ dùng WebSocket URL từ Render
- ✅ Frontend sẽ kết nối được với WebSocket server
- ✅ Active Now sẽ hoạt động
- ✅ Real-time messaging sẽ hoạt động

## 🎯 URLs

### Production:
- **Frontend:** `https://website-tutor-student-s8rl.vercel.app`
- **API:** `https://website-tutor-student-s8rl.vercel.app/api`
- **WebSocket:** `https://website-tutor-student-1.onrender.com`

### Environment Variables:
- **VITE_WEBSOCKET_URL:** `https://website-tutor-student-1.onrender.com`
- **VITE_API_URL:** `https://website-tutor-student-s8rl.vercel.app/api` (tùy chọn)

