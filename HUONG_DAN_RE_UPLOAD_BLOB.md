# Hướng Dẫn Re-upload Files Lên Blob Storage

## ⚠️ Lưu Ý

**Blob Storage hiện đã bị block** do vượt quá giới hạn Advanced Operations (3.6k/2k).

**Access sẽ resume vào: 12/10/25**

Nếu muốn tiếp tục dùng Vercel Blob Storage, cần:
1. Đợi đến 12/10/25 (reset usage limits)
2. Hoặc upgrade lên Pro plan

## 🔄 Re-upload Files (Sau Khi Reset)

### Bước 1: Lấy BLOB_READ_WRITE_TOKEN

1. Vào Vercel Dashboard
2. Project Settings → Storage → Blob
3. Copy `BLOB_READ_WRITE_TOKEN`

### Bước 2: Re-upload Files

```bash
# Set token
export BLOB_READ_WRITE_TOKEN=your-token-here

# Run upload script
npx tsx scripts/upload-to-blob.ts
```

Script sẽ:
- Đọc tất cả files từ `data/` folder
- Upload lên Blob Storage với `access: 'public'`
- Overwrite files cũ

### Bước 3: Kiểm Tra

1. Vào Vercel Dashboard → Storage → Blob
2. Kiểm tra files đã được upload
3. Đảm bảo tất cả files có `access: 'public'`

## 🎯 Khuyến Nghị

**Nên deploy lên Render** thay vì đợi reset vì:
- ✅ Không bị block
- ✅ Không giới hạn Advanced Operations
- ✅ Miễn phí
- ✅ Hoạt động ngay lập tức

