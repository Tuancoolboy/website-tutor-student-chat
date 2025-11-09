# Hướng Dẫn Build Command và Start Command trên Render

## 🚨 Vấn Đề

Render yêu cầu **Build Command** là bắt buộc, nhưng WebSocket server không cần build.

## ✅ Giải Pháp

### Option 1: Để TRỐNG (Nếu Render cho phép)
- **Build Command:** Để **TRỐNG** (không nhập gì)
- **Start Command:** `npm run ws`

### Option 2: Dùng `npm install` (Nếu Render bắt buộc phải nhập)
- **Build Command:** `npm install`
- **Start Command:** `npm run ws`

## 📋 Cấu Hình Chi Tiết

### Service: WebSocket Server

#### Cấu Hình Cơ Bản:
- **Name:** `tutor-websocket`
- **Region:** Chọn region gần nhất
- **Branch:** `main`
- **Root Directory:** `/` (để trống)
- **Runtime:** `Node`

#### Build Command:
```
npm install
```
**Hoặc để TRỐNG nếu Render cho phép**

**Giải thích:**
- ✅ `npm install` - Chỉ cài đặt dependencies, không build code
- ❌ `npm run build` - KHÔNG dùng (sẽ build frontend và gây lỗi)
- ❌ `npm run ws` - KHÔNG dùng ở đây (đây là Start Command)

#### Start Command:
```
npm run ws
```
**QUAN TRỌNG:** Đây là command để chạy WebSocket server

**Giải thích:**
- `npm run ws` chạy `tsx ws-server.ts`
- `tsx` sẽ tự động compile và chạy TypeScript
- Không cần build trước

## 🔍 Phân Biệt Build Command vs Start Command

### Build Command:
- **Mục đích:** Chuẩn bị code trước khi chạy (compile, build, install)
- **Khi nào chạy:** Trước mỗi lần deploy
- **Ví dụ:** `npm install`, `npm run build`, `npm install && npm run build`

### Start Command:
- **Mục đích:** Chạy ứng dụng sau khi build
- **Khi nào chạy:** Sau khi build xong, để khởi động server
- **Ví dụ:** `npm run ws`, `node server.js`, `npm start`

## ⚠️ Lưu Ý Quan Trọng

### ❌ KHÔNG Dùng:
```
Build Command: npm run build
```
**Lý do:** Sẽ build frontend (Vite) và gây lỗi TypeScript

### ❌ KHÔNG Dùng:
```
Build Command: npm run ws
```
**Lý do:** Đây là Start Command, không phải Build Command

### ✅ NÊN Dùng:
```
Build Command: npm install
Start Command: npm run ws
```

## 📝 Checklist

- [ ] Build Command: `npm install` (hoặc để trống)
- [ ] Start Command: `npm run ws`
- [ ] Environment Variables đã cấu hình
- [ ] Test deploy thành công

## 🐛 Troubleshooting

### Lỗi: "Build failed"
**Nguyên nhân:** Build Command đang build frontend

**Giải pháp:**
1. Kiểm tra Build Command có phải `npm run build` không
2. Đổi thành `npm install` hoặc để trống
3. Deploy lại

### Lỗi: "Start command failed"
**Nguyên nhân:** Start Command sai hoặc thiếu dependencies

**Giải pháp:**
1. Kiểm tra Start Command: `npm run ws`
2. Kiểm tra `package.json` có script `ws` không
3. Kiểm tra logs trên Render để xem lỗi cụ thể

## ✅ Kết Luận

**Build Command:** `npm install` (hoặc để trống)  
**Start Command:** `npm run ws`

**Lưu ý:** Build Command chỉ cần install dependencies, không cần build code vì `tsx` sẽ tự động compile TypeScript khi chạy.

