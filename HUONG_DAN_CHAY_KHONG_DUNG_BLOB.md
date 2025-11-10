# Hướng Dẫn Chạy Ứng Dụng Không Dùng Blob Storage

## Giới hạn 2KB là gì?

⚠️ **Lưu ý quan trọng**: Giới hạn 2KB chỉ áp dụng cho **file upload** (ảnh, video, PDF) - **KHÔNG áp dụng cho database JSON files**.

- **Database (users.json, sessions.json, etc.)**: Không bị giới hạn 2KB, có thể lưu dữ liệu lớn
- **File upload** (ảnh, video, PDF): Bị giới hạn 2KB do config `upload.maxFileSize = 2KB`

## Cách Chạy Không Dùng Blob Storage

### 1. Chạy Local (Development)

**Cách 1: Không set BLOB_READ_WRITE_TOKEN**
```bash
# Không cần set BLOB_READ_WRITE_TOKEN
npm run dev
npm run api
```

**Cách 2: Set USE_LOCAL_STORAGE=true**
```bash
# Trong file .env hoặc terminal
export USE_LOCAL_STORAGE=true
npm run dev
npm run api
```

Ứng dụng sẽ tự động sử dụng local file system (thư mục `data/`).

### 2. Deploy trên Render/Railway (Production)

**Không set BLOB_READ_WRITE_TOKEN** trong environment variables:

```bash
# Render/Railway Environment Variables
USE_LOCAL_STORAGE=true  # Optional: explicitly disable blob
# KHÔNG set BLOB_READ_WRITE_TOKEN
```

Ứng dụng sẽ sử dụng local file system trên server.

### 3. Deploy trên Vercel

⚠️ **KHÔNG THỂ chạy không dùng Blob Storage trên Vercel** vì:
- Vercel có file system **read-only**
- Phải dùng Blob Storage hoặc database bên ngoài
- Nếu set `USE_LOCAL_STORAGE=true` trên Vercel, ứng dụng sẽ báo lỗi

**Giải pháp**: Deploy trên Render hoặc Railway thay vì Vercel.

## So Sánh

| Platform | File System | Có thể dùng local storage? |
|----------|-------------|---------------------------|
| Local (development) | Read/Write | ✅ Có |
| Render | Read/Write | ✅ Có |
| Railway | Read/Write | ✅ Có |
| Vercel | Read-only | ❌ Không (phải dùng Blob) |

## Kiểm Tra Storage Đang Dùng

Khi khởi động server, bạn sẽ thấy log:
- `[Storage] Using local file system (no BLOB_READ_WRITE_TOKEN found)`
- `[Storage] Using local file system (blob storage disabled via USE_LOCAL_STORAGE=true)`
- `[Storage] Using Vercel Blob Storage (BLOB_READ_WRITE_TOKEN found)`

## Database Files

Database files được lưu trong thư mục `data/`:
- `data/users.json`
- `data/sessions.json`
- `data/assignments.json`
- `data/conversations.json`
- etc.

Các file này **KHÔNG bị giới hạn 2KB** và có thể lưu dữ liệu lớn.

## File Upload

File upload (ảnh, video, PDF) bị giới hạn 2KB do config:
```typescript
// lib/config.ts
upload: {
  maxFileSize: 2 * 1024, // 2KB
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4']
}
```

Nếu muốn tăng giới hạn file upload, sửa `maxFileSize` trong `lib/config.ts`.

## Tóm Tắt

1. ✅ **Database có thể chạy không dùng Blob Storage**
2. ✅ **Chạy local hoặc Render/Railway**: Không set `BLOB_READ_WRITE_TOKEN` hoặc set `USE_LOCAL_STORAGE=true`
3. ❌ **Vercel**: Phải dùng Blob Storage (file system read-only)
4. ⚠️ **Giới hạn 2KB chỉ áp dụng cho file upload**, không áp dụng cho database

## Troubleshooting

### Lỗi: "Cannot use local storage on Vercel"
- **Nguyên nhân**: Đang deploy trên Vercel với `USE_LOCAL_STORAGE=true`
- **Giải pháp**: Deploy trên Render/Railway thay vì Vercel

### Lỗi: "BLOB_READ_WRITE_TOKEN is required on Vercel"
- **Nguyên nhân**: Đang deploy trên Vercel mà không có token
- **Giải pháp**: 
  - Set `BLOB_READ_WRITE_TOKEN` trong Vercel environment variables
  - Hoặc deploy trên Render/Railway thay vì Vercel

### Muốn dùng Blob Storage nhưng không có token
- **Giải pháp**: Deploy trên Render/Railway và không set `BLOB_READ_WRITE_TOKEN` (sẽ dùng local storage)

