# Tutor Support System

Hệ thống hỗ trợ gia sư và học sinh - HCMUT

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run frontend
npm run dev

# Run API server
npm run api

# Run WebSocket server
npm run ws
```

## 🔧 Configuration

### Environment Variables

- `BLOB_READ_WRITE_TOKEN`: Vercel Blob Storage token (required for Vercel deployment)
- `JWT_SECRET`: JWT secret key
- `PORT`: API server port (default: 3000)
- `API_PORT`: Alternative API port
- `FRONTEND_URL`: Frontend URL

## 📦 Deployment

### Vercel

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Render/Railway

1. Connect GitHub repository
2. Set environment variables
3. Deploy

## 🐛 Troubleshooting

### Lỗi 403 Forbidden khi đăng nhập

**Nguyên nhân:**
- Blob storage không public
- Token không đúng
- URL cache bị stale

**Giải pháp:**
1. Đảm bảo `BLOB_READ_WRITE_TOKEN` được set trong Vercel environment variables
2. Re-upload files với `access: 'public'`:
   ```bash
   BLOB_READ_WRITE_TOKEN=your-token npx tsx scripts/upload-to-blob.ts
   ```
3. Code đã tự động retry với token khi gặp 403
4. Clear cache và retry với URL mới

### Advanced Operations vượt quá giới hạn

**Giải pháp:**
- Code đã được tối ưu với cache URLs
- Giảm `list()` operations từ ~2000 xuống ~20/tháng
- Deploy code mới để áp dụng cache

## 📝 Notes

- Database files lưu trong `data/` folder (local) hoặc Vercel Blob Storage (production)
- File upload giới hạn 2KB (chỉ áp dụng cho file upload, không áp dụng cho database)
- Blob storage operations được cache để giảm Advanced Operations
