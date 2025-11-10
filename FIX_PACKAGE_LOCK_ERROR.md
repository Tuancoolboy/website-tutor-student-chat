# 🔧 Fix Package Lock Error trên Vercel

## ❌ Lỗi

```
npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync.
npm error Missing: yaml@2.8.1 from lock file
```

## ✅ Giải Pháp

### Nguyên Nhân

- `package-lock.json` không đồng bộ với `package.json`
- `tailwindcss` cần `yaml@2.8.1` thông qua `postcss-load-config@6.0.1`
- Lock file cũ không có `yaml@2.8.1`

### Cách Fix

1. **Xóa node_modules và package-lock.json:**
   ```bash
   rm -rf node_modules package-lock.json
   ```

2. **Cài đặt lại dependencies:**
   ```bash
   npm install
   ```

3. **Kiểm tra build local:**
   ```bash
   npm run build
   ```

4. **Commit và push package-lock.json:**
   ```bash
   git add package-lock.json
   git commit -m "fix: Cập nhật package-lock.json để đồng bộ với package.json"
   git push origin main
   ```

## ✅ Đã Fix

- ✅ Đã rebuild package-lock.json từ đầu
- ✅ `yaml@2.8.1` đã có trong package-lock.json
- ✅ Build local thành công
- ✅ Đã commit và push lên GitHub (commit: `75e3485`)

## 📋 Kiểm Tra

### Kiểm Tra yaml trong package-lock.json:

```bash
npm ls yaml
```

Kết quả:
```
tutor-support-system@0.0.0
├─┬ @emotion/react@11.14.0
│ └── yaml@1.10.2
└─┬ tailwindcss@3.4.18
  └── yaml@2.8.1
```

### Kiểm Tra npm ci:

```bash
npm ci --dry-run
```

Nếu thành công → package-lock.json đã đồng bộ!

## 🚀 Vercel Build

Sau khi push package-lock.json lên GitHub:
1. Vercel sẽ tự động build lại
2. Vercel sẽ sử dụng package-lock.json mới
3. Build sẽ thành công!

## 🔧 Nếu Vẫn Lỗi

### 1. Kiểm Tra Cache

Vercel có thể sử dụng cache cũ. Thử:
- Xóa build cache trên Vercel (nếu có)
- Hoặc đợi Vercel build lại với lock file mới

### 2. Kiểm Tra package-lock.json

Đảm bảo `yaml@2.8.1` có trong package-lock.json:
```bash
grep -A 10 '"yaml@2.8.1"' package-lock.json
```

### 3. Rebuild Từ Đầu

Nếu vẫn lỗi, thử rebuild từ đầu:
```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: Rebuild package-lock.json"
git push origin main
```

## ✅ Kết Quả

Sau khi fix:
- ✅ package-lock.json đồng bộ với package.json
- ✅ `yaml@2.8.1` có trong lock file
- ✅ Build local thành công
- ✅ Vercel build sẽ thành công!

