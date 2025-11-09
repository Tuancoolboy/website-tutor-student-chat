#!/bin/bash

# Script để push project lên GitHub
# Usage: ./push-to-github.sh [repository-name] [github-username]

# Màu sắc cho output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Lấy thông tin từ arguments hoặc hỏi user
REPO_NAME=${1:-"Website-tutor-student"}
GITHUB_USER=${2:-"Tuancoolboy"}

echo -e "${GREEN}🚀 Bắt đầu push project lên GitHub...${NC}"
echo -e "${YELLOW}Repository: ${GITHUB_USER}/${REPO_NAME}${NC}"
echo ""

# Kiểm tra xem đã có git repository chưa
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git repository đã tồn tại${NC}"
    read -p "Bạn có muốn tiếp tục? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}📦 Khởi tạo git repository...${NC}"
    git init
fi

# Kiểm tra remote đã tồn tại chưa
if git remote | grep -q "^origin$"; then
    echo -e "${YELLOW}⚠️  Remote 'origin' đã tồn tại${NC}"
    CURRENT_URL=$(git remote get-url origin)
    echo -e "Current URL: ${CURRENT_URL}"
    read -p "Bạn có muốn thay đổi remote URL? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote remove origin
        git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
        echo -e "${GREEN}✅ Đã cập nhật remote URL${NC}"
    fi
else
    echo -e "${GREEN}🔗 Thêm remote repository...${NC}"
    git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
fi

# Kiểm tra branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
echo -e "${GREEN}📍 Current branch: ${CURRENT_BRANCH}${NC}"

# Add files
echo -e "${GREEN}📝 Thêm files vào git...${NC}"
git add .

# Kiểm tra có thay đổi không
if git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  Không có thay đổi nào để commit${NC}"
    exit 0
fi

# Commit
echo -e "${GREEN}💾 Tạo commit...${NC}"
git commit -m "Initial commit: Tutor Support System

- Added API server with Express.js
- Added WebSocket server for real-time features
- Added React frontend with Vite
- Added authentication system
- Added messaging system with online status
- Added user management
- Added session management
- Added forum functionality
- Added calendar and availability management"

# Push
echo -e "${GREEN}🚀 Pushing code lên GitHub...${NC}"
echo -e "${YELLOW}⚠️  Bạn có thể cần nhập username và password/token${NC}"
echo ""

# Thử push
if git push -u origin ${CURRENT_BRANCH}; then
    echo -e "${GREEN}✅ Push thành công!${NC}"
    echo -e "${GREEN}🔗 Repository: https://github.com/${GITHUB_USER}/${REPO_NAME}${NC}"
else
    echo -e "${RED}❌ Push thất bại${NC}"
    echo -e "${YELLOW}💡 Có thể bạn cần:${NC}"
    echo "   1. Tạo repository trên GitHub trước"
    echo "   2. Sử dụng Personal Access Token thay vì password"
    echo "   3. Kiểm tra quyền truy cập repository"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Hoàn thành!${NC}"

