# Hướng Dẫn Chạy Local Development

## 🚀 Các Lệnh Chạy Local

### Option 1: Chạy Tất Cả (Frontend + API + WebSocket)

#### Terminal 1: Frontend
```bash
npm run dev
```
- Chạy frontend trên: `http://localhost:5173`
- Hot reload tự động khi sửa code

#### Terminal 2: API Server
```bash
npm run dev:api
```
- Chạy API server trên: `http://localhost:3000`
- Auto-reload khi sửa code (tsx watch)

#### Terminal 3: WebSocket Server
```bash
npm run dev:ws
```
- Chạy WebSocket server trên: `http://localhost:3001`
- Auto-reload khi sửa code (tsx watch)

### Option 2: Chạy Riêng Lẻ (Không Auto-reload)

#### Terminal 1: Frontend
```bash
npm run dev
```

#### Terminal 2: API Server
```bash
npm run api
```

#### Terminal 3: WebSocket Server
```bash
npm run ws
```

## 📋 Các Scripts Có Sẵn

### Frontend:
- `npm run dev` - Chạy frontend với Vite (hot reload)
- `npm run build` - Build frontend cho production
- `npm run preview` - Preview build production

### API Server:
- `npm run api` - Chạy API server (không auto-reload)
- `npm run dev:api` - Chạy API server với auto-reload (tsx watch)

### WebSocket Server:
- `npm run ws` - Chạy WebSocket server (không auto-reload)
- `npm run dev:ws` - Chạy WebSocket server với auto-reload (tsx watch)

## 🔧 Cấu Hình

### Ports Mặc Định:
- **Frontend:** `http://localhost:5173`
- **API Server:** `http://localhost:3000`
- **WebSocket Server:** `http://localhost:3001`

### Environment Variables (Local):
- Không cần cấu hình (dùng giá trị mặc định trong `src/env.ts`)
- API URL: `http://localhost:3000/api`
- WebSocket URL: `http://localhost:3001`

## 🚀 Quick Start

### Bước 1: Install Dependencies
```bash
npm install
```

### Bước 2: Chạy Development Servers

#### Cách 1: Chạy Tất Cả (3 terminals)
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run dev:api

# Terminal 3
npm run dev:ws
```

#### Cách 2: Chạy Riêng Lẻ
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - API
npm run api

# Terminal 3 - WebSocket
npm run ws
```

### Bước 3: Mở Browser
1. Mở: `http://localhost:5173`
2. Đăng nhập và test

## 📝 Lưu Ý

### Auto-reload:
- `npm run dev` - Frontend auto-reload (Vite)
- `npm run dev:api` - API auto-reload (tsx watch)
- `npm run dev:ws` - WebSocket auto-reload (tsx watch)

### Không Auto-reload:
- `npm run api` - API không auto-reload (cần restart manual)
- `npm run ws` - WebSocket không auto-reload (cần restart manual)

### Recommended:
- Dùng `npm run dev:api` và `npm run dev:ws` để có auto-reload
- Dùng `npm run dev` cho frontend (đã có auto-reload mặc định)

## 🐛 Troubleshooting

### Lỗi: "Port already in use"

**Nguyên nhân:**
- Port đã được sử dụng bởi process khác

**Giải pháp:**
```bash
# Tìm process đang dùng port
lsof -i :3000  # API
lsof -i :3001  # WebSocket
lsof -i :5173  # Frontend

# Kill process
kill -9 <PID>
```

### Lỗi: "Cannot find module"

**Nguyên nhân:**
- Dependencies chưa được install

**Giải pháp:**
```bash
npm install
```

### Lỗi: "WebSocket connection failed"

**Nguyên nhân:**
- WebSocket server chưa chạy

**Giải pháp:**
1. Kiểm tra WebSocket server đang chạy: `http://localhost:3001/health`
2. Restart WebSocket server: `npm run dev:ws`

## ✅ Checklist

- [ ] Dependencies đã install: `npm install`
- [ ] Frontend đang chạy: `npm run dev`
- [ ] API server đang chạy: `npm run dev:api`
- [ ] WebSocket server đang chạy: `npm run dev:ws`
- [ ] Mở browser: `http://localhost:5173`
- [ ] Test đăng nhập
- [ ] Test WebSocket connection
- [ ] Test Active Now
- [ ] Test messaging

## 🎯 Tóm Tắt

### Development (Recommended):
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run dev:api

# Terminal 3
npm run dev:ws
```

### Production Build:
```bash
# Build frontend
npm run build

# Run API (production)
npm run api

# Run WebSocket (production)
npm run ws
```

## 📚 Tài Liệu Tham Khảo

- `package.json` - Scripts configuration
- `src/env.ts` - Environment configuration
- `server.ts` - API server
- `ws-server.ts` - WebSocket server

