# Fix Vercel Build Network Error (ECONNRESET)

## 🔴 Lỗi

```
npm error code ECONNRESET
npm error network aborted
npm error network This is a problem related to network connectivity.
```

## 📋 Nguyên Nhân

Lỗi `ECONNRESET` xảy ra khi:
1. **Network timeout** - Kết nối đến npm registry bị timeout
2. **Network instability** - Kết nối mạng không ổn định trên Vercel build server
3. **npm registry issues** - npm registry đang gặp vấn đề tạm thời
4. **Dependencies quá lớn** - Quá nhiều dependencies cần download

## ✅ Giải Pháp

### Solution 1: Retry Deployment (Khuyến Nghị)

Đây là lỗi tạm thời, thường tự resolve khi retry:

1. Vào **Vercel Dashboard** → **Deployments**
2. Tìm deployment bị lỗi
3. Click **Retry** (hoặc **Redeploy**)
4. Đợi build hoàn thành (thường 2-5 phút)

### Solution 2: Clear Build Cache

1. Vào **Vercel Dashboard** → **Deployments**
2. Click vào deployment bị lỗi
3. Click **Settings** → **Clear Build Cache**
4. Click **Redeploy**

### Solution 3: Optimize Dependencies

Nếu lỗi vẫn tiếp tục, có thể do dependencies quá nhiều:

1. Kiểm tra `package.json` - loại bỏ dependencies không cần thiết
2. Sử dụng `npm ci` thay vì `npm install` (faster, more reliable)
3. Thêm `.npmrc` file để configure npm registry

### Solution 4: Configure npm Registry

Tạo file `.npmrc` trong root directory:

```
registry=https://registry.npmjs.org/
fetch-retries=3
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
```

### Solution 5: Add Build Configuration

Thêm vào `vercel.json`:

```json
{
  "buildCommand": "npm ci && npm run build",
  "installCommand": "npm ci --prefer-offline --no-audit"
}
```

## 🧪 Kiểm Tra

Sau khi retry, kiểm tra:

1. ✅ Build thành công (không có lỗi network)
2. ✅ Dependencies được install đúng
3. ✅ Build output được tạo
4. ✅ Deployment thành công

## 📝 Lưu Ý

### Network Errors là Tạm Thời

- ✅ Lỗi `ECONNRESET` thường tự resolve khi retry
- ✅ Không phải lỗi code - là lỗi network infrastructure
- ✅ Vercel build servers có thể gặp network issues tạm thời

### Best Practices

1. **Use `npm ci`** - Faster và more reliable cho CI/CD
2. **Lock dependencies** - Đảm bảo `package-lock.json` được commit
3. **Monitor builds** - Kiểm tra build logs thường xuyên
4. **Retry on failure** - Network errors thường resolve khi retry

### Dependencies Optimization

- ✅ Loại bỏ dependencies không cần thiết
- ✅ Sử dụng `optionalDependencies` cho dependencies tùy chọn
- ✅ Kiểm tra `package.json` size (nên < 1MB)

## 🚀 Next Steps

1. ✅ **Retry deployment** trên Vercel Dashboard
2. ✅ **Wait for build** (2-5 phút)
3. ✅ **Check build logs** - Xem có lỗi nào khác không
4. ✅ **Test deployment** - Verify app hoạt động đúng

## 📚 Resources

- [Vercel Build Logs](https://vercel.com/docs/concepts/deployments/build-logs)
- [npm Network Issues](https://docs.npmjs.com/troubleshooting/network-issues)
- [Vercel Build Configuration](https://vercel.com/docs/build-step)

## ❓ FAQ

### Q: Tại sao lỗi network lại xảy ra?

**A:** Lỗi network có thể do:
- npm registry timeout
- Network instability trên Vercel build server
- Dependencies quá nhiều/lớn
- npm registry đang gặp vấn đề tạm thời

### Q: Làm sao tránh lỗi này?

**A:** 
- Use `npm ci` thay vì `npm install`
- Optimize dependencies
- Clear build cache thường xuyên
- Monitor build logs

### Q: Lỗi này có ảnh hưởng đến app không?

**A:** Không! Đây chỉ là lỗi build. App vẫn hoạt động bình thường sau khi build thành công.

### Q: Phải retry bao nhiêu lần?

**A:** Thường chỉ cần 1-2 lần retry. Nếu vẫn lỗi sau 3 lần, kiểm tra dependencies và network configuration.

