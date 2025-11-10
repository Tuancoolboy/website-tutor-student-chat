# Blob Storage - Giải Thích Chi Tiết

## 📌 Blob Storage Là Gì?

**Blob Storage trong ứng dụng này được dùng để LƯU DATABASE (JSON files)**, không phải để lưu file upload (ảnh, video).

## 🔍 Cách Hoạt Động

### 1. Database Files (JSON)

Blob storage lưu các file JSON database:

```
data/users.json          → Danh sách users
data/sessions.json       → Danh sách sessions
data/assignments.json    → Danh sách assignments
data/messages.json       → Danh sách messages
data/conversations.json  → Danh sách conversations
data/forum-posts.json    → Danh sách forum posts
... và nhiều file khác
```

**Vị trí lưu:**
- **Blob Storage**: `data/users.json`, `data/sessions.json`, ...
- **Local Storage**: Thư mục `data/` trên server

**Kích thước:** KHÔNG bị giới hạn 2KB, có thể lưu dữ liệu lớn

### 2. File Upload (Ảnh, Video)

File upload KHÔNG được lưu trong blob storage, mà được lưu dạng **base64 string** trong database JSON:

```json
// forum-posts.json
{
  "id": "post_123",
  "title": "Bài viết có ảnh",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",  // ← Base64 string
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  ]
}
```

**Giới hạn 2KB:** Chỉ áp dụng cho file upload (ảnh, video), không áp dụng cho database JSON.

## 📊 So Sánh

| Loại | Lưu ở đâu? | Giới hạn 2KB? | Ví dụ |
|------|-----------|---------------|-------|
| **Database JSON** | Blob Storage / Local `data/` | ❌ Không | `users.json`, `sessions.json` |
| **File Upload** | Base64 trong JSON | ✅ Có | Ảnh trong `forum-posts.json` |

## 💾 Cách Lưu Trữ

### Khi dùng Blob Storage (Vercel):

```
Vercel Blob Storage
└── data/
    ├── users.json          ← Database (không giới hạn 2KB)
    ├── sessions.json       ← Database (không giới hạn 2KB)
    ├── forum-posts.json    ← Database (chứa base64 ảnh, giới hạn 2KB cho mỗi ảnh)
    └── ...
```

### Khi dùng Local Storage (Render/Railway/Local):

```
Server File System
└── data/
    ├── users.json          ← Database (không giới hạn 2KB)
    ├── sessions.json       ← Database (không giới hạn 2KB)
    ├── forum-posts.json    ← Database (chứa base64 ảnh, giới hạn 2KB cho mỗi ảnh)
    └── ...
```

## 🎯 Tóm Tắt

1. ✅ **Blob Storage = Lưu Database JSON files**
   - `users.json`, `sessions.json`, `assignments.json`, etc.
   - Không bị giới hạn 2KB
   - Có thể lưu dữ liệu lớn

2. ✅ **File Upload = Lưu base64 trong JSON**
   - Ảnh/video được chuyển thành base64 string
   - Base64 string được lưu trong JSON (ví dụ: `forum-posts.json`)
   - Bị giới hạn 2KB (do config `upload.maxFileSize = 2KB`)

3. ✅ **Giới hạn 2KB chỉ áp dụng cho file upload**, không áp dụng cho database

## 🔧 Code Tham Khảo

### Blob Storage - Lưu Database:

```typescript
// lib/storage.ts
private async writeToBlob<T>(filename: string, data: T[]): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  const blobPath = `data/${filename}`;  // ← Lưu database JSON
  
  await put(blobPath, content, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true
  });
}
```

### File Upload - Lưu Base64:

```typescript
// src/pages/common/CreatePost.tsx
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const reader = new FileReader()
  reader.onloadend = () => {
    const base64String = reader.result as string  // ← Chuyển thành base64
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, base64String]  // ← Lưu base64 vào state
    }))
  }
  reader.readAsDataURL(file)
}
```

## ❓ FAQ

**Q: Blob storage có bị giới hạn 2KB không?**  
A: Không. Blob storage lưu database JSON files, không bị giới hạn 2KB.

**Q: File upload có lưu trong blob storage không?**  
A: Không. File upload được lưu dạng base64 string trong JSON database.

**Q: Giới hạn 2KB áp dụng cho cái gì?**  
A: Chỉ áp dụng cho file upload (ảnh, video), không áp dụng cho database JSON.

**Q: Có thể tăng giới hạn file upload không?**  
A: Có. Sửa `maxFileSize` trong `lib/config.ts`:

```typescript
upload: {
  maxFileSize: 5 * 1024 * 1024, // 5MB (thay vì 2KB)
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4']
}
```

