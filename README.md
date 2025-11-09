# HCMUT Learning Management System

Hệ thống quản lý học tập trực tuyến toàn diện với giao diện hiện đại, được xây dựng bằng React + Vite + TypeScript, tích hợp Material-UI và Tailwind CSS.

## 🚀 Tính năng chính

### 👨‍🎓 Cho Student (Học sinh):
- **Dashboard**: Tổng quan về tiến độ học tập, lịch sử buổi học, thống kê cá nhân
- **Search Tutors**: Tìm kiếm và lọc gia sư theo môn học, đánh giá, thời gian
- **Book Session**: Đặt lịch học với gia sư qua wizard step-by-step
- **Session Detail**: Chi tiết buổi học, tham gia video call, tài liệu
- **Evaluate Session**: Đánh giá và phản hồi sau buổi học
- **View Progress**: Theo dõi tiến độ học tập, mục tiêu, thành tích
- **AI Chatbot**: Hỗ trợ học tập bằng AI chatbot thông minh

### 👨‍🏫 Cho Tutor (Gia sư):
- **Dashboard**: Tổng quan về học sinh, lịch dạy, thu nhập, thống kê
- **Set Availability**: Quản lý lịch rảnh, thời gian dạy, lịch tái diễn
- **Manage Sessions**: Quản lý buổi học, chỉnh sửa thông tin, xem chi tiết
- **Handle Cancel/Reschedule**: Xử lý yêu cầu hủy/đổi lịch từ học sinh
- **Track Student Progress**: Theo dõi tiến độ học sinh chi tiết, điểm mạnh/yếu

### 🏢 Cho Management (Quản lý):
- **Management Dashboard**: Tổng quan hệ thống, thống kê toàn diện, cảnh báo
- **Approval Requests**: Phê duyệt yêu cầu từ học sinh và gia sư
- **Reports & Analytics**: Báo cáo và phân tích dữ liệu chi tiết
- **Award Training Credits**: Quản lý và trao điểm rèn luyện

### 🌐 Common Screens (Màn hình chung):
- **Login**: Xác thực SSO, đăng nhập bằng email hoặc nhà cung cấp bên thứ 3
- **Profile Management**: Quản lý thông tin cá nhân, học vấn, sở thích
- **Digital Library Access**: Truy cập thư viện số, tài liệu học tập
- **Online Community Forum**: Diễn đàn cộng đồng, chia sẻ kiến thức
- **Notifications Center**: Trung tâm thông báo, quản lý alerts

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite (tốc độ build nhanh)
- **UI Libraries**: 
  - Material-UI (MUI) v7.2.0 - Icons, Components, Form controls
  - Tailwind CSS - Styling và responsive design
- **Routing**: React Router DOM v6
- **State Management**: React Context + Hooks
- **Theme**: Custom ThemeContext với Dark/Light mode
- **Icons**: Material-UI Icons (@mui/icons-material)

## 📁 Cấu trúc thư mục

```
src/
├── components/
│   └── ui/                     # UI components tái sử dụng
│       ├── Button.tsx          # Button component
│       ├── Card.tsx            # Card component
│       ├── Input.tsx           # Input component
│       ├── Avatar.tsx          # Avatar component
│       ├── Modal.tsx           # Modal component
│       ├── Table.tsx           # Table component
│       └── Sidebar.tsx         # Sidebar component
├── contexts/
│   └── ThemeContext.tsx        # Quản lý theme light/dark
├── pages/
│   ├── student/                # Trang cho học sinh (7 trang)
│   │   ├── StudentDashboard.tsx
│   │   ├── SearchTutors.tsx
│   │   ├── BookSession.tsx
│   │   ├── SessionDetail.tsx
│   │   ├── EvaluateSession.tsx
│   │   ├── ViewProgress.tsx
│   │   └── ChatbotSupport.tsx
│   ├── tutor/                  # Trang cho gia sư (5 trang)
│   │   ├── TutorDashboard.tsx
│   │   ├── SetAvailability.tsx
│   │   ├── ManageSessions.tsx
│   │   ├── HandleCancelReschedule.tsx
│   │   └── TrackStudentProgress.tsx
│   ├── management/              # Trang quản lý (4 trang)
│   │   ├── ManagementDashboard.tsx
│   │   ├── ApprovalRequests.tsx
│   │   ├── ReportsAnalytics.tsx
│   │   └── AwardCredits.tsx
│   └── common/                 # Màn hình chung (5 trang)
│       ├── Login.tsx
│       ├── ProfileManagement.tsx
│       ├── DigitalLibraryAccess.tsx
│       ├── OnlineCommunityForum.tsx
│       └── NotificationsCenter.tsx
├── App.tsx                     # Main app component với routing
├── main.tsx                    # Entry point
└── index.css                   # Global styles với Tailwind
```

## 🎨 Design System

### UI/UX Pattern
- **3-Column Layout**: Sidebar + Main Content + Right Panel (desktop)
- **Mobile-First**: Responsive design với mobile drawer
- **Consistent Navigation**: Sidebar navigation với quick actions
- **Dark/Light Theme**: Toggle theme với persistent preference

### Component Architecture
- **Reusable UI Components**: Button, Card, Input, Modal, Table
- **Theme Integration**: Consistent styling với Tailwind CSS
- **Responsive Design**: Mobile drawer, adaptive layouts
- **Accessibility**: Keyboard navigation, screen reader support

## 🚀 Cài đặt và chạy

1. **Cài đặt dependencies:**
```bash
npm install
```

2. **Chạy development server:**
```bash
npm run dev
```

3. **Build cho production:**
```bash
npm run build
```

4. **Preview production build:**
```bash
npm run preview
```

## 🎯 Tính năng nổi bật

### 🎨 Modern UI/UX
- **Consistent Design**: Tất cả trang đều có cùng UI/UX pattern
- **HCMUT Branding**: Logo HCMUT thống nhất trên tất cả trang
- **Professional Look**: Giao diện chuyên nghiệp, hiện đại
- **Intuitive Navigation**: Điều hướng trực quan, dễ sử dụng

### 📱 Responsive Design
- **Mobile-First**: Thiết kế ưu tiên mobile
- **Adaptive Layouts**: Tự động điều chỉnh cho mọi thiết bị
- **Touch-Friendly**: Tối ưu cho cảm ứng
- **Mobile Drawer**: Navigation drawer cho mobile

### 🌙 Dark Mode Support
- **Theme Toggle**: Chuyển đổi light/dark theme
- **Persistent Preference**: Lưu lựa chọn theme
- **Smooth Transitions**: Chuyển đổi mượt mà
- **Consistent Styling**: Styling nhất quán cho cả 2 theme

### ⚡ Performance
- **Fast Build**: Vite build tool nhanh
- **Optimized Bundle**: Kích thước bundle tối ưu
- **Lazy Loading**: Tải component khi cần
- **Code Splitting**: Chia nhỏ code theo route

## 🎨 Color Palette & Theming

### Light Theme
- **Primary**: Blue (#3B82F6)
- **Secondary**: Gray (#6B7280)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)
- **Background**: Gray-50 (#F9FAFB)
- **Text**: Gray-900 (#111827)

### Dark Theme
- **Primary**: Blue (#60A5FA)
- **Secondary**: Gray (#9CA3AF)
- **Success**: Green (#34D399)
- **Warning**: Orange (#FBBF24)
- **Error**: Red (#F87171)
- **Background**: Gray-900 (#111827)
- **Text**: White (#FFFFFF)

## 📊 System Overview

### User Roles & Permissions
- **Student**: 7 trang chức năng học tập
- **Tutor**: 5 trang quản lý dạy học
- **Management**: 4 trang quản lý hệ thống
- **Common**: 5 trang dùng chung cho tất cả roles

### Navigation Structure
```
/student/*          # Student pages
/tutor/*            # Tutor pages  
/management/*       # Management pages
/common/*           # Common screens
```

### Key Features by Role

#### Student Features
- Dashboard với thống kê cá nhân
- Tìm kiếm gia sư nâng cao
- Booking session với wizard
- AI chatbot hỗ trợ học tập
- Theo dõi tiến độ chi tiết

#### Tutor Features
- Dashboard quản lý học sinh
- Quản lý lịch dạy linh hoạt
- Theo dõi tiến độ học sinh
- Xử lý yêu cầu hủy/đổi lịch

#### Management Features
- Dashboard tổng quan hệ thống
- Phê duyệt yêu cầu
- Báo cáo và phân tích
- Quản lý điểm rèn luyện

## 🔧 Customization

### Theme Configuration
```typescript
// src/contexts/ThemeContext.tsx
const theme = {
  light: {
    background: 'bg-gray-50',
    text: 'text-gray-900',
    // ... other light theme configs
  },
  dark: {
    background: 'bg-gray-900', 
    text: 'text-white',
    // ... other dark theme configs
  }
}
```

### Component Styling
```typescript
// Sử dụng Tailwind classes
<div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
    Title
  </h1>
</div>
```

## 📱 Mobile Support

- **Responsive Breakpoints**: sm, md, lg, xl
- **Touch Gestures**: Swipe, tap, pinch
- **Mobile-Optimized**: Components tối ưu cho mobile
- **Progressive Web App**: Sẵn sàng cho PWA

## 🔮 Future Enhancements

- [ ] Real-time notifications với WebSocket
- [ ] Video call integration (WebRTC)
- [ ] Payment processing (Stripe/PayPal)
- [ ] Advanced analytics với charts
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)
- [ ] AI-powered recommendations
- [ ] Advanced search với Elasticsearch
- [ ] Real-time collaboration tools
- [ ] Advanced reporting dashboard

## 🏗️ Architecture Decisions

### Why React + TypeScript?
- **Type Safety**: Phát hiện lỗi compile-time
- **Developer Experience**: IntelliSense, auto-completion
- **Maintainability**: Code dễ bảo trì và mở rộng
- **Performance**: Virtual DOM, optimized rendering

### Why Vite?
- **Fast Development**: Hot reload nhanh
- **Modern Build**: ES modules, native ESM
- **Optimized Production**: Tree shaking, code splitting
- **Developer Experience**: Simple config, fast builds

### Why Tailwind CSS?
- **Utility-First**: Styling nhanh và consistent
- **Responsive**: Built-in responsive utilities
- **Dark Mode**: Native dark mode support
- **Performance**: Purged CSS, small bundle size

## 📚 Documentation

Chi tiết các document được lưu trong thư mục `docs/` (không bao gồm trong repository):
- `API_DOCS.md` - API Reference
- `BACKEND_README.md` - Backend Architecture & Setup
- `CLASS_ENROLLMENT_API_DOCS.md` - Class & Enrollment APIs
- `DEPLOYMENT.md` - Deployment Guide (Vercel)
- `FLOW_DOCUMENTATION.md` - System Flow & Architecture
- `HUONG_DAN_SU_DUNG.md` - User Guide
- `QUICK_REFERENCE.md` - Quick Reference
- `SCHEMAS_REFERENCE.md` - Data Schemas
- `TYPES_REFERENCE.md` - TypeScript Types

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên GitHub repository.

## 🎉 Acknowledgments

- Material-UI team cho component library tuyệt vời
- Tailwind CSS team cho utility-first CSS framework
- React team cho framework mạnh mẽ
- Vite team cho build tool nhanh

---

**HCMUT Learning Management System** - Hệ thống quản lý học tập trực tuyến hiện đại và toàn diện! 🚀