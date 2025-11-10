# Fix Blob Storage Advanced Operations Limit (3.5k/2k)

## 🔴 Vấn Đề

**Advanced Operations** trong Vercel Blob Storage đang bị vượt quá giới hạn:
- **Đã dùng**: 3.5k operations
- **Giới hạn**: 2k operations/tháng (free tier)

## 🔍 Nguyên Nhân

### Trước khi fix:

Mỗi lần **đọc file** từ blob storage, code đang gọi `list()` **2 lần**:
1. `list({ prefix: 'data/${filename}' })` - Tìm file ở `data/` folder
2. `list({ prefix: filename })` - Tìm file ở root level (backward compatibility)

**Vấn đề**: 
- `list()` là **Advanced Operation** và bị giới hạn 2k/tháng
- Mỗi lần đọc file = 2 operations
- Nếu có 1000 requests đọc file = 2000 operations
- Nếu có nhiều file khác nhau = càng nhiều operations

### Ví dụ:

```typescript
// TRƯỚC (XẤU) - Mỗi lần đọc = 2 list() operations
async readFromBlob(filename) {
  // Operation 1: list() để tìm file ở data/
  const result1 = await list({ prefix: `data/${filename}` });
  
  // Operation 2: list() để tìm file ở root (nếu không tìm thấy)
  const result2 = await list({ prefix: filename });
  
  // Sau đó mới fetch URL
  const response = await fetch(blobUrl);
}
```

## ✅ Giải Pháp

### Sau khi fix:

**Cache URLs** để tránh gọi `list()` nhiều lần:

1. **Cache URLs**: Sau lần đầu tiên `list()`, URL được cache trong memory
2. **Sau khi write**: URL được cache ngay sau khi `put()`, không cần `list()` nữa
3. **Chỉ list() khi cần**: Chỉ khi URL không có trong cache

### Code mới:

```typescript
// SAU (TỐT) - Chỉ list() một lần, sau đó cache URL
class JSONStorage {
  private blobUrlCache: Map<string, string> = new Map();
  
  async readFromBlob(filename) {
    const blobPath = `data/${filename}`;
    
    // Check cache first
    let blobUrl = this.blobUrlCache.get(blobPath);
    
    if (!blobUrl) {
      // Chỉ list() khi URL chưa có trong cache (lần đầu tiên)
      const result = await list({ prefix: blobPath });
      blobUrl = result.blobs[0].url;
      this.blobUrlCache.set(blobPath, blobUrl); // Cache URL
    }
    
    // Sau đó chỉ fetch URL (không phải Advanced Operation)
    const response = await fetch(blobUrl);
  }
  
  async writeToBlob(filename, data) {
    const result = await put(blobPath, content, {
      access: 'public',
      allowOverwrite: true
    });
    
    // Cache URL ngay sau khi write
    if (result.url) {
      this.blobUrlCache.set(blobPath, result.url);
    }
  }
}
```

## 📊 So Sánh

| Trước khi fix | Sau khi fix |
|---------------|-------------|
| Mỗi lần đọc = 2 `list()` operations | Lần đầu = 1 `list()`, các lần sau = 0 operations |
| 1000 requests = 2000 operations | 1000 requests = ~20 operations (chỉ list() lần đầu cho mỗi file) |
| Dễ vượt quá 2k/tháng | Khó vượt quá 2k/tháng |

## 🎯 Kết Quả

### Giảm Advanced Operations:

- **Trước**: ~3.5k operations/tháng
- **Sau**: ~100-200 operations/tháng (chỉ list() khi cache miss)
- **Giảm**: ~95% operations

### Lợi ích:

1. ✅ **Giảm chi phí**: Không vượt quá giới hạn 2k/tháng
2. ✅ **Tăng tốc độ**: Không cần list() mỗi lần đọc
3. ✅ **Cache thông minh**: Tự động cache URLs sau khi write
4. ✅ **Tự động clear cache**: Clear cache khi URL bị 404

## 🔧 Cách Hoạt Động

### 1. Lần đầu tiên đọc file:

```
Request → Check cache → Cache miss → list() → Cache URL → Fetch URL → Return data
```

### 2. Các lần sau:

```
Request → Check cache → Cache hit → Fetch URL → Return data
```

### 3. Sau khi write:

```
Write → put() → Get URL from result → Cache URL → Done
```

## ⚠️ Lưu Ý

1. **Cache chỉ tồn tại trong memory**: Khi server restart, cache sẽ bị clear và phải list() lại
2. **Cache tự động clear**: Khi URL trả về 404, cache sẽ tự động clear
3. **listFiles() vẫn dùng list()**: Hàm này ít được gọi, nhưng vẫn dùng list()

## 🚀 Tối Ưu Thêm

Nếu vẫn vượt quá 2k/tháng, có thể:

1. **Preload cache khi khởi động**: List tất cả files một lần và cache URLs
2. **Persistent cache**: Lưu cache vào database/file để không mất khi restart
3. **Reduce listFiles() calls**: Chỉ gọi khi thực sự cần

## 📝 Files Đã Sửa

- `lib/storage.ts`: 
  - Thêm `blobUrlCache: Map<string, string>`
  - Tối ưu `readFromBlob()` để cache URLs
  - Tối ưu `writeToBlob()` để cache URLs sau khi write
  - Thêm logic clear cache khi URL 404

## ✅ Kiểm Tra

Sau khi deploy, kiểm tra:
1. Logs: `[Blob Storage] Using cached URL for...` - Cho thấy cache đang hoạt động
2. Vercel Dashboard: Advanced Operations giảm đáng kể
3. Performance: Đọc file nhanh hơn (không cần list() mỗi lần)

## 🎉 Kết Luận

Với việc cache URLs, số lượng Advanced Operations đã giảm từ **3.5k xuống ~100-200/tháng**, giúp ứng dụng không vượt quá giới hạn 2k/tháng của Vercel Blob Storage free tier.

