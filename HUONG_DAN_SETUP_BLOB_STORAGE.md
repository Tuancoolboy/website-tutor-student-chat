# Hướng Dẫn Setup Vercel Blob Storage

## 🎯 Mục Đích

Vercel serverless functions có **read-only file system**. Không thể ghi file vào `/var/task/data/`.

Cần dùng **Vercel Blob Storage** để lưu trữ dữ liệu (messages, conversations, users, etc.).

## 📋 Các Bước

### Bước 1: Tạo Vercel Blob Storage

1. Vào **Vercel Dashboard** → Project của bạn
2. Vào **Storage** tab (bên trái)
3. Click **Create Database**
4. Chọn **Blob**
5. Đặt tên (ví dụ: `tutor-storage`)
6. Click **Create**

### Bước 2: Lấy Token

1. Sau khi tạo, click vào Blob Storage vừa tạo
2. Vào **Settings** tab
3. Tìm **BLOB_READ_WRITE_TOKEN**
4. Click **Copy** để copy token

Token sẽ có dạng: `vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Bước 3: Thêm Environment Variable

1. Vào **Settings** → **Environment Variables**
2. Click **Add New**
3. Nhập:
   - **Key:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** Token bạn vừa copy
   - **Environment:** Chọn **Production, Preview, Development** (tất cả)
4. Click **Save**

### Bước 4: Upload Data Files (Lần Đầu)

Lần đầu tiên, cần upload các file JSON từ `data/` lên Blob Storage:

#### Option 1: Dùng Vercel Dashboard (Thủ Công)

1. Vào Blob Storage → **Files** tab
2. Click **Upload**
3. Upload từng file:
   - `users.json`
   - `conversations.json`
   - `messages.json`
   - `sessions.json`
   - etc.
4. **Lưu ý:** Upload vào thư mục `data/` (tạo thư mục nếu cần)

#### Option 2: Dùng Script (Tự Động)

Tạo script `scripts/upload-to-blob.ts`:

```typescript
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as fs from 'fs';

async function uploadToBlob() {
  const dataDir = join(process.cwd(), 'data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const content = await readFile(join(dataDir, file), 'utf-8');
    const blobPath = `data/${file}`;
    
    await put(blobPath, content, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    });
    
    console.log(`✅ Uploaded ${file} to ${blobPath}`);
  }
}

uploadToBlob().catch(console.error);
```

Chạy script:
```bash
BLOB_READ_WRITE_TOKEN=your-token npx tsx scripts/upload-to-blob.ts
```

### Bước 5: Redeploy

1. Vào **Deployments** tab
2. Click **Redeploy** trên deployment mới nhất
3. Hoặc push code mới lên GitHub (tự động deploy)

### Bước 6: Kiểm Tra

1. Vào **Functions** tab
2. Xem logs của function `/api/messages/send`
3. Nếu thấy log `⚠️ WARNING: Running on Vercel but BLOB_READ_WRITE_TOKEN is not set!` → Token chưa được set
4. Nếu không thấy warning → Token đã được set đúng

## 🧪 Test

1. Mở website trên Vercel
2. Đăng nhập
3. Gửi tin nhắn
4. Nếu thành công → ✅ Fixed!
5. Nếu vẫn lỗi → Kiểm tra lại token và redeploy

## 📝 Lưu Ý

### Vercel Blob Storage Pricing

- **Free tier:** 1 GB storage, 1 GB bandwidth/month
- **Pricing:** $0.15/GB storage, $0.15/GB bandwidth
- **Perfect for:** JSON files, small files, temporary storage

### Code Đã Được Cập Nhật

File `lib/storage.ts` đã được cập nhật để:
- ✅ Tự động detect Vercel và force dùng Blob Storage
- ✅ Throw error rõ ràng nếu thiếu token trên Vercel
- ✅ Hiển thị warning nếu thiếu token (không phải Vercel)

### Alternative: Database

Nếu cần database thật (không phải JSON files), có thể dùng:
- **Vercel Postgres** (free tier: 256 MB)
- **Vercel KV** (Redis, free tier: 256 MB)
- **External database** (MongoDB Atlas, Supabase, etc.)

## 🚀 Next Steps

1. ✅ Tạo Vercel Blob Storage
2. ✅ Copy token
3. ✅ Thêm `BLOB_READ_WRITE_TOKEN` vào Environment Variables
4. ✅ Upload data files (lần đầu)
5. ✅ Redeploy
6. ✅ Test gửi tin nhắn
7. ✅ Verify data được lưu vào Blob Storage

## 📚 Tài Liệu

- [Vercel Blob Storage Docs](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

## ❓ FAQ

### Q: Tại sao cần Blob Storage?

**A:** Vercel serverless functions có read-only file system. Không thể ghi file vào `/var/task/data/`. Cần dùng Blob Storage để lưu trữ dữ liệu.

### Q: Có thể dùng database thay vì JSON files không?

**A:** Có! Có thể dùng Vercel Postgres, Vercel KV, hoặc external database (MongoDB Atlas, Supabase, etc.).

### Q: Blob Storage có free không?

**A:** Có! Free tier: 1 GB storage, 1 GB bandwidth/month. Đủ cho hầu hết các ứng dụng nhỏ.

### Q: Làm sao upload data files lên Blob Storage?

**A:** Có 2 cách:
1. **Thủ công:** Upload qua Vercel Dashboard
2. **Tự động:** Dùng script `scripts/upload-to-blob.ts`

### Q: Token có bị lộ không?

**A:** Token chỉ được dùng trong serverless functions (backend), không được expose ra frontend. An toàn!

