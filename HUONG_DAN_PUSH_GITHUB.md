# Hướng Dẫn Push Project Lên GitHub

## 📋 Các Bước Thực Hiện

### Bước 1: Repository GitHub

Repository đã được tạo: **Website-tutor-student**
- URL: https://github.com/Tuancoolboy/Website-tutor-student.git
- Repository hiện đang empty, sẵn sàng để push code

### Bước 2: Khởi Tạo Git trong Project

Mở terminal trong thư mục project và chạy các lệnh sau:

```bash
# 1. Khởi tạo git repository
git init

# 2. Thêm tất cả files vào git
git add .

# 3. Tạo commit đầu tiên
git commit -m "Initial commit: Tutor Support System"

# 4. Đổi tên branch thành main (nếu cần)
git branch -M main

# 5. Thêm remote repository
git remote add origin https://github.com/Tuancoolboy/Website-tutor-student.git

# 6. Push code lên GitHub
git push -u origin main
```

### Bước 3: Xác Thực GitHub (Nếu Cần)

Nếu GitHub yêu cầu xác thực:

**Cách 1: Personal Access Token (Khuyến nghị)**
1. Vào GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Chọn quyền: `repo` (full control of private repositories)
4. Copy token
5. Khi push, dùng token thay vì password:
   - Username: `Tuancoolboy`
   - Password: `[paste token here]`

**Cách 2: SSH Key**
```bash
# Tạo SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy SSH key
cat ~/.ssh/id_ed25519.pub

# Thêm SSH key vào GitHub:
# Settings → SSH and GPG keys → New SSH key

# Thay đổi remote URL sang SSH
git remote set-url origin git@github.com:Tuancoolboy/Website-tutor-student.git
```

## 🔒 Files Nhạy Cảm (Đã được bỏ qua trong .gitignore)

Các file sau sẽ **KHÔNG** được push lên GitHub:
- `.env` - Environment variables
- `node_modules/` - Dependencies
- `dist/` - Build files
- `.DS_Store` - OS files
- `*.log` - Log files

## 📝 Lưu Ý Quan Trọng

### 1. Dữ Liệu (data/)

**Hiện tại:** Thư mục `data/` chứa mock data sẽ được commit lên GitHub.

**Nếu bạn không muốn commit data files:**
- Thêm `data/` vào `.gitignore`
- Hoặc chỉ commit file structure, không commit dữ liệu thực

### 2. JWT Secret

**Kiểm tra:** File `lib/config.ts` có chứa JWT secret mặc định.
- **Development:** OK (có thể commit)
- **Production:** Nên dùng environment variable

### 3. Database/Storage

- File JSON trong `data/` là mock data
- Có thể commit để người khác test
- Hoặc tạo script seed để generate data

## 🚀 Các Lệnh Git Thường Dùng

### Push Code Mới
```bash
git add .
git commit -m "Your commit message"
git push
```

### Xem Trạng Thái
```bash
git status
```

### Xem Lịch Sử Commit
```bash
git log
```

### Xem Remote Repository
```bash
git remote -v
```

### Clone Repository (Cho Người Khác)
```bash
git clone https://github.com/Tuancoolboy/Website-tutor-student.git
cd Website-tutor-student
npm install
npm run seed  # Tạo mock data
```

## 🐛 Troubleshooting

### Lỗi: "remote origin already exists"
```bash
# Xóa remote cũ
git remote remove origin

# Thêm remote mới
git remote add origin https://github.com/Tuancoolboy/Website-tutor-student.git
```

### Lỗi: "Authentication failed"
- Kiểm tra username/password
- Dùng Personal Access Token thay vì password
- Hoặc dùng SSH key

### Lỗi: "Permission denied"
- Kiểm tra bạn có quyền push vào repository
- Kiểm tra repository là Public hay Private
- Kiểm tra bạn đã được thêm làm collaborator (nếu là Private repo)

### Lỗi: "Large files"
```bash
# Nếu có file quá lớn, thêm vào .gitignore
# Hoặc dùng Git LFS (Large File Storage)
```

## 📚 Tài Liệu Tham Khảo

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Documentation](https://docs.github.com/)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## ✅ Checklist Trước Khi Push

- [ ] Đã tạo repository trên GitHub
- [ ] Đã kiểm tra `.gitignore` (không commit files nhạy cảm)
- [ ] Đã kiểm tra JWT secret (nếu cần)
- [ ] Đã test project chạy được
- [ ] Đã commit code
- [ ] Đã thêm remote repository
- [ ] Đã push code lên GitHub
- [ ] Đã kiểm tra code trên GitHub

## 🎯 Sau Khi Push

1. **Kiểm tra trên GitHub:**
   - Vào repository: `https://github.com/Tuancoolboy/Website-tutor-student`
   - Xem code đã được push chưa
   - Kiểm tra README.md (nếu có)

2. **Cập Nhật README.md:**
   - Thêm mô tả project
   - Thêm hướng dẫn cài đặt
   - Thêm hướng dẫn chạy
   - Thêm screenshots (nếu có)

3. **Thêm Collaborators (Nếu Cần):**
   - Settings → Collaborators → Add people
   - Thêm người bạn muốn chia sẻ code

4. **Setup GitHub Actions (Tùy Chọn):**
   - Tự động test khi push code
   - Tự động deploy
   - Tự động build

## 💡 Tips

1. **Commit Message:**
   - Viết rõ ràng, mô tả thay đổi
   - Ví dụ: "Add user authentication", "Fix messaging bug"

2. **Branch Strategy:**
   - `main` - Code chính (production)
   - `develop` - Code phát triển
   - `feature/xxx` - Tính năng mới
   - `bugfix/xxx` - Sửa lỗi

3. **Regular Commits:**
   - Commit thường xuyên
   - Push thường xuyên
   - Không commit code chưa hoàn thành

4. **Code Review:**
   - Tạo Pull Request trước khi merge
   - Review code trước khi merge
   - Test code trước khi merge

