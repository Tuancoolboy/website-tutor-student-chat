# Kiểm Tra Vercel Logs Để Debug Login 500 Error

## 🔍 Các Bước Kiểm Tra

### Bước 1: Vào Vercel Dashboard

1. Vào **Vercel Dashboard** → Project của bạn
2. Vào **Functions** tab
3. Tìm function `/api/auth/login`
4. Click vào function đó

### Bước 2: Xem Logs

1. Vào **Logs** tab
2. Tìm logs mới nhất (khi bạn vừa thử đăng nhập)
3. Tìm các log có prefix `[Blob Storage]` hoặc `[Storage]`

### Bước 3: Xác Định Lỗi

Tìm các lỗi sau:

#### Lỗi 1: `BLOB_READ_WRITE_TOKEN is not set`

```
[Blob Storage] BLOB_READ_WRITE_TOKEN is not set! Cannot read users.json
```

**Giải pháp:**
- Vào **Settings** → **Environment Variables**
- Thêm `BLOB_READ_WRITE_TOKEN`
- Redeploy project

#### Lỗi 2: `No blob found for users.json`

```
[Blob Storage] No blob found for users.json at data/users.json or root level
```

**Giải pháp:**
- Upload file lên Blob Storage:
  ```bash
  BLOB_READ_WRITE_TOKEN=your-token npx tsx scripts/upload-to-blob.ts
  ```

#### Lỗi 3: `Failed to list blobs`

```
[Blob Storage] Error listing blobs for data/users.json: ...
```

**Giải pháp:**
- Kiểm tra `BLOB_READ_WRITE_TOKEN` có đúng không
- Kiểm tra token có quyền đọc Blob Storage không

#### Lỗi 4: `Failed to fetch blob`

```
[Blob Storage] Failed to fetch blob: 404 Not Found
```

**Giải pháp:**
- File không tồn tại trong Blob Storage
- Upload file lại

#### Lỗi 5: `Invalid JSON format`

```
[Blob Storage] Invalid JSON format for data/users.json
```

**Giải pháp:**
- File bị corrupted
- Upload file lại từ local

## 📋 Checklist

- [ ] **BLOB_READ_WRITE_TOKEN** được set trong Vercel environment variables
- [ ] **File users.json** tồn tại trong Blob Storage
- [ ] **Token có quyền** đọc Blob Storage
- [ ] **File không bị corrupted** (có thể download và parse JSON)

## 🚀 Quick Fix

### Nếu chưa upload files:

```bash
# Set token
export BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xwOA5VJjf30ajOZs_lz7krAFWU83LbbUADufrwawyA97MrQ

# Upload files
npx tsx scripts/upload-to-blob.ts
```

### Nếu token chưa được set:

1. Vào **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Thêm `BLOB_READ_WRITE_TOKEN`
3. Redeploy project

## 📝 Logs Mẫu (Thành Công)

```
[Blob Storage] Attempting to read users.json from data/users.json
[Blob Storage] Found 1 blobs with prefix data/users.json
[Blob Storage] Found blob at data/users.json, URL: https://...
[Blob Storage] Successfully read users.json, found 10 items
```

## 📝 Logs Mẫu (Lỗi)

```
[Blob Storage] BLOB_READ_WRITE_TOKEN is not set! Cannot read users.json
Error: BLOB_READ_WRITE_TOKEN is required to read from Blob Storage
```

Hoặc:

```
[Blob Storage] No blob found for users.json at data/users.json or root level
Error: No blob found for users.json. Please upload the file to Blob Storage.
```

## ✅ Sau Khi Fix

1. ✅ Kiểm tra logs không còn lỗi
2. ✅ Test login lại
3. ✅ Verify có thể đăng nhập thành công

