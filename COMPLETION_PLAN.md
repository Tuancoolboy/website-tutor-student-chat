# Kế Hoạch Hoàn Thiện Dự Án Tutor Support System

## 📋 Tổng Quan

Tài liệu này mô tả kế hoạch chi tiết để hoàn thiện các phần còn lại của dự án Tutor Support System, bao gồm các module: Student, Tutor, Common Features, Management, và Testing.

---

## 🎯 Mục Tiêu

1. **Hoàn thiện logic cancel/reschedule cho Class** - Xử lý conflict với lịch cố định hàng tuần
2. **Implement Student Progress Tracking** - Theo dõi tiến độ học tập và sync cho mobile
3. **Xây dựng Test Suite** - Sử dụng pytest để test các API endpoints
4. **Phát triển Common Features** - Message Socket, Digital Library, Community Forum, Notification System
5. **Redesign Management UI/UX** - Desktop và Mobile, implement đầy đủ chức năng

---

## 📦 Các Module Cần Hoàn Thiện

### 1. STUDENT MODULE

#### 1.1. Fix Logic Cancel/Reschedule Class

**Vấn đề hiện tại:**
- Class có lịch cố định hàng tuần (recurring sessions)
- Khi cancel/reschedule một class, có thể gây conflict với các session đã được tạo tự động
- Cần xử lý logic để không ảnh hưởng đến các session khác trong cùng class

**Yêu cầu:**
- Khi cancel/reschedule class, cần xác định phạm vi:
  - Cancel/Reschedule toàn bộ class (tất cả sessions tương lai)
  - Cancel/Reschedule một session cụ thể trong class
- Xử lý conflict với lịch cố định:
  - Nếu reschedule class, cần update tất cả sessions tương lai
  - Nếu cancel class, cần hủy tất cả sessions tương lai hoặc chỉ hủy từ một thời điểm cụ thể
- Backend API cần validate:
  - Không cho phép reschedule nếu conflict với availability của tutor
  - Không cho phép cancel nếu session đã bắt đầu hoặc quá gần thời gian bắt đầu (< 24h)

**Implementation:**
- **Backend (`routes/session-requests/index.ts`):**
  - Thêm logic validate cho class requests
  - Xử lý batch update cho tất cả sessions tương lai của class
  - Thêm endpoint `POST /api/session-requests/class` để xử lý riêng class requests
  
- **Frontend (`src/components/session/RequestDialog.tsx`):**
  - Thêm UI để chọn phạm vi cancel/reschedule (toàn bộ class hoặc session cụ thể)
  - Hiển thị cảnh báo về ảnh hưởng đến các sessions khác
  - Validate phía client trước khi submit

**Files cần sửa:**
- `routes/session-requests/index.ts`
- `routes/session-requests/[id].ts`
- `src/components/session/RequestDialog.tsx`
- `src/pages/student/SessionDetail.tsx`
- `src/pages/student/SessionDetailMobile.tsx`

---

### 2. TUTOR MODULE

#### 2.1. Track Student Progress

**Yêu cầu:**
- Theo dõi tiến độ học tập của từng student trong các class/session
- Metrics cần track:
  - Attendance rate (tỷ lệ tham gia)
  - Assignment completion rate
  - Quiz scores và average
  - Competency progress
  - Overall performance score
- Hiển thị progress dashboard cho tutor
- Sync data cho mobile version

**Implementation:**

**Backend:**
- **New API Endpoints:**
  - `GET /api/tutors/:tutorId/students/progress` - Lấy progress của tất cả students
  - `GET /api/tutors/:tutorId/students/:studentId/progress` - Lấy progress chi tiết của một student
  - `GET /api/tutors/:tutorId/classes/:classId/progress` - Lấy progress của tất cả students trong class
  - `POST /api/progress/update` - Update progress (tự động hoặc manual)

- **New Service (`lib/services/progressService.ts`):**
  ```typescript
  - calculateAttendanceRate(studentId, classId)
  - calculateAssignmentCompletion(studentId, classId)
  - calculateQuizAverage(studentId, classId)
  - calculateOverallProgress(studentId, classId)
  - updateProgress(studentId, classId, metrics)
  ```

- **Data Model (`lib/types.ts`):**
  ```typescript
  interface StudentProgress {
    id: string
    studentId: string
    classId?: string
    sessionId?: string
    attendanceRate: number
    assignmentCompletion: number
    quizAverage: number
    competencyProgress: { [key: string]: number }
    overallScore: number
    lastUpdated: string
  }
  ```

**Frontend Desktop:**
- **New Component (`src/pages/tutor/StudentProgress.tsx`):**
  - Dashboard hiển thị progress của tất cả students
  - Filters: by class, by date range, by performance level
  - Charts: attendance trends, score distribution, competency radar
  - Export progress reports (PDF/Excel)

- **Update (`src/pages/tutor/TutorSessionDetail.tsx`):**
  - Thêm tab "Progress" hiển thị progress của students trong session/class
  - Individual student progress cards

**Frontend Mobile:**
- **New Component (`src/pages/tutor/StudentProgressMobile.tsx`):**
  - Compact dashboard cho mobile
  - Swipeable student cards
  - Quick filters và search

**Files cần tạo:**
- `lib/services/progressService.ts`
- `routes/tutors/[id]/students/progress.ts`
- `routes/tutors/[id]/students/[studentId]/progress.ts`
- `src/pages/tutor/StudentProgress.tsx`
- `src/pages/tutor/StudentProgressMobile.tsx`
- `data/progress.json` (nếu chưa có)

**Files cần sửa:**
- `lib/types.ts` - Thêm StudentProgress interface
- `src/pages/tutor/TutorSessionDetail.tsx` - Thêm Progress tab
- `src/pages/tutor/TutorSessionDetailMobile.tsx` - Thêm Progress tab

---

### 3. TEST CASE MODULE

#### 3.1. API Endpoint Testing với pytest

**Yêu cầu:**
- Test tất cả API endpoints
- Test các scenarios: success, error, edge cases
- Test authentication và authorization
- Test validation
- Coverage tối thiểu 80%

**Implementation:**

**Setup:**
- **File (`tests/conftest.py`):**
  ```python
  - pytest fixtures: test_client, auth_headers, mock_users, mock_sessions
  - Test database setup/teardown
  - Mock Vercel Blob Storage
  ```

**Test Structure:**
```
tests/
├── conftest.py
├── test_auth.py
├── test_sessions.py
├── test_classes.py
├── test_session_requests.py
├── test_assignments.py
├── test_quizzes.py
├── test_enrollments.py
├── test_availability.py
├── test_notifications.py
└── test_progress.py
```

**Test Cases cần implement:**

1. **Authentication (`tests/test_auth.py`):**
   - POST /api/auth/register - success, duplicate email, invalid data
   - POST /api/auth/login - success, wrong credentials
   - GET /api/auth/me - success, unauthorized
   - POST /api/auth/refresh - success, invalid token

2. **Sessions (`tests/test_sessions.py`):**
   - GET /api/sessions - list, filter, pagination
   - POST /api/sessions - create, validation, conflict
   - GET /api/sessions/:id - success, not found
   - PUT /api/sessions/:id - update, unauthorized
   - DELETE /api/sessions/:id - delete, cascade

3. **Classes (`tests/test_classes.py`):**
   - GET /api/classes - list, filter
   - POST /api/classes - create, validation
   - GET /api/classes/:id - success, not found
   - PUT /api/classes/:id - update
   - POST /api/classes/:id/generate-sessions - generate, conflict

4. **Session Requests (`tests/test_session_requests.py`):**
   - POST /api/session-requests - create cancel, create reschedule
   - GET /api/session-requests - list, filter
   - PUT /api/session-requests/:id/approve - approve, unauthorized
   - PUT /api/session-requests/:id/reject - reject
   - DELETE /api/session-requests/:id - withdraw

5. **Assignments (`tests/test_assignments.py`):**
   - GET /api/assignments - list
   - POST /api/assignments - create
   - POST /api/assignments/:id/submit - submit, validation
   - GET /api/assignments/:id/submissions - list submissions

6. **Quizzes (`tests/test_quizzes.py`):**
   - GET /api/quizzes - list
   - POST /api/quizzes - create
   - POST /api/quizzes/:id/submit - submit, calculate score
   - GET /api/quizzes/:id/results - get results

7. **Progress (`tests/test_progress.py`):**
   - GET /api/tutors/:id/students/progress - list progress
   - GET /api/tutors/:id/students/:studentId/progress - get detail
   - POST /api/progress/update - update progress

**Files cần tạo:**
- `tests/conftest.py`
- `tests/test_auth.py`
- `tests/test_sessions.py`
- `tests/test_classes.py`
- `tests/test_session_requests.py`
- `tests/test_assignments.py`
- `tests/test_quizzes.py`
- `tests/test_enrollments.py`
- `tests/test_availability.py`
- `tests/test_notifications.py`
- `tests/test_progress.py`
- `pytest.ini` hoặc `pyproject.toml`

**Dependencies:**
- `pytest`
- `pytest-asyncio` (nếu API async)
- `pytest-cov` (coverage)
- `httpx` hoặc `requests` (HTTP client)

---

### 4. COMMON FEATURES MODULE

#### 4.1. Message Socket (Real-time Chat)

**Yêu cầu:**
- Real-time messaging giữa student và tutor
- Support group chat cho class
- File attachments
- Message history
- Online/offline status

**Implementation:**

**Backend:**
- **WebSocket Server (`ws-server/index.ts`):**
  ```typescript
  - Socket.io hoặc native WebSocket
  - Room management (1-on-1, group)
  - Message broadcasting
  - Connection management
  ```

- **API Endpoints:**
  - `GET /api/conversations` - List conversations
  - `GET /api/conversations/:id/messages` - Get message history
  - `POST /api/conversations` - Create conversation
  - `POST /api/conversations/:id/messages` - Send message (fallback nếu WebSocket fail)

- **Data Model:**
  ```typescript
  interface Conversation {
    id: string
    type: 'direct' | 'group'
    participants: string[]
    classId?: string
    lastMessage?: Message
    createdAt: string
    updatedAt: string
  }

  interface Message {
    id: string
    conversationId: string
    senderId: string
    content: string
    attachments?: string[]
    type: 'text' | 'file' | 'system'
    createdAt: string
    readBy: string[]
  }
  ```

**Frontend:**
- **Components:**
  - `src/components/message/ChatWindow.tsx` - Main chat UI
  - `src/components/message/ConversationList.tsx` - List conversations
  - `src/components/message/MessageBubble.tsx` - Individual message
  - `src/hooks/useWebSocket.ts` - WebSocket hook

**Files cần tạo:**
- `ws-server/index.ts`
- `lib/services/messageService.ts`
- `routes/conversations/index.ts`
- `routes/conversations/[id]/messages.ts`
- `src/components/message/ChatWindow.tsx`
- `src/components/message/ConversationList.tsx`
- `src/components/message/MessageBubble.tsx`
- `src/hooks/useWebSocket.ts`

---

#### 4.2. Digital Library Sync HCMUT_LIBRARY

**Yêu cầu:**
- Sync tài liệu từ HCMUT Library
- Search và filter tài liệu
- Download/View tài liệu
- Bookmark favorite materials
- Recommend materials based on subject

**Implementation:**

**Backend:**
- **API Endpoints:**
  - `GET /api/library/search` - Search materials
  - `GET /api/library/sync` - Sync from HCMUT Library (cron job)
  - `GET /api/library/materials/:id` - Get material detail
  - `POST /api/library/bookmarks` - Bookmark material
  - `GET /api/library/recommendations` - Get recommendations

- **Service (`lib/services/libraryService.ts`):**
  ```typescript
  - syncFromHCMUTLibrary() - Fetch và sync materials
  - searchMaterials(query, filters)
  - getRecommendations(userId, subject)
  - bookmarkMaterial(userId, materialId)
  ```

- **Data Model:**
  ```typescript
  interface LibraryMaterial {
    id: string
    title: string
    author: string
    subject: string
    type: 'book' | 'article' | 'thesis' | 'video'
    url: string
    thumbnail?: string
    description: string
    tags: string[]
    hcmutId: string
    syncedAt: string
  }
  ```

**Frontend:**
- **Pages:**
  - `src/pages/common/DigitalLibrary.tsx` - Main library page
  - `src/pages/common/DigitalLibraryMobile.tsx` - Mobile version
  - `src/pages/common/MaterialDetail.tsx` - Material detail page

**Files cần tạo:**
- `lib/services/libraryService.ts`
- `routes/library/index.ts`
- `routes/library/[id].ts`
- `src/pages/common/DigitalLibrary.tsx`
- `src/pages/common/DigitalLibraryMobile.tsx`
- `src/pages/common/MaterialDetail.tsx`
- `data/library-materials.json`

---

#### 4.3. Community Forum

**Yêu cầu:**
- Post questions/answers
- Categories (by subject, general, etc.)
- Upvote/downvote
- Comments và replies
- Search và filter
- User reputation system

**Implementation:**

**Backend:**
- **API Endpoints:**
  - `GET /api/forum/posts` - List posts
  - `POST /api/forum/posts` - Create post
  - `GET /api/forum/posts/:id` - Get post detail
  - `PUT /api/forum/posts/:id` - Update post
  - `DELETE /api/forum/posts/:id` - Delete post
  - `POST /api/forum/posts/:id/vote` - Upvote/downvote
  - `POST /api/forum/posts/:id/comments` - Add comment
  - `GET /api/forum/categories` - List categories

- **Data Model:**
  ```typescript
  interface ForumPost {
    id: string
    authorId: string
    title: string
    content: string
    category: string
    tags: string[]
    upvotes: number
    downvotes: number
    views: number
    answers: ForumAnswer[]
    acceptedAnswerId?: string
    createdAt: string
    updatedAt: string
  }

  interface ForumAnswer {
    id: string
    postId: string
    authorId: string
    content: string
    upvotes: number
    downvotes: number
    isAccepted: boolean
    createdAt: string
  }
  ```

**Frontend:**
- **Pages:**
  - `src/pages/common/Forum.tsx` - Main forum page
  - `src/pages/common/ForumMobile.tsx` - Mobile version
  - `src/pages/common/PostDetail.tsx` - Post detail page
  - `src/pages/common/CreatePost.tsx` - Create post page

**Files cần tạo:**
- `routes/forum/posts/index.ts`
- `routes/forum/posts/[id].ts`
- `routes/forum/categories.ts`
- `src/pages/common/Forum.tsx`
- `src/pages/common/ForumMobile.tsx`
- `src/pages/common/PostDetail.tsx`
- `src/pages/common/CreatePost.tsx`
- `data/forum-posts.json`

---

#### 4.4. Notification System

**Yêu cầu:**
- Backend notification queue
- Delay time cố định (ví dụ: 5 phút)
- GET API để fetch notifications
- Mark as read/unread
- Filter by type
- Không cần real-time (không dùng socket)

**Implementation:**

**Backend:**
- **Notification Queue Service (`lib/services/notificationQueue.ts`):**
  ```typescript
  - addToQueue(notification, delayMinutes)
  - processQueue() - Cron job chạy mỗi X phút
  - sendNotification(notification)
  ```

- **API Endpoints:**
  - `GET /api/notifications` - List notifications (với filters)
  - `PUT /api/notifications/:id/read` - Mark as read
  - `PUT /api/notifications/:id/unread` - Mark as unread
  - `DELETE /api/notifications/:id` - Delete notification
  - `PUT /api/notifications/read-all` - Mark all as read

- **Cron Job (`lib/cron/notificationCron.ts`):**
  ```typescript
  - Chạy mỗi 5 phút
  - Process queue và gửi notifications
  ```

**Frontend:**
- **Components:**
  - `src/components/notification/NotificationBell.tsx` - Notification bell icon
  - `src/components/notification/NotificationList.tsx` - Notification dropdown
  - `src/pages/common/Notifications.tsx` - Full notification page
  - `src/hooks/useNotifications.ts` - Hook để fetch notifications

**Files cần tạo:**
- `lib/services/notificationQueue.ts`
- `lib/cron/notificationCron.ts`
- `routes/notifications/index.ts`
- `routes/notifications/[id].ts`
- `src/components/notification/NotificationBell.tsx`
- `src/components/notification/NotificationList.tsx`
- `src/pages/common/Notifications.tsx`
- `src/hooks/useNotifications.ts`

**Files cần sửa:**
- `server.ts` - Thêm cron job
- `routes/session-requests/index.ts` - Thêm notification vào queue khi tạo request
- `routes/session-requests/[id].ts` - Thêm notification vào queue khi approve/reject

---

### 5. MANAGEMENT MODULE

#### 5.1. Redesign UI/UX Desktop

**Yêu cầu:**
- Redesign theo chuẩn hiện đại, phù hợp với vibe của student/tutor LMS
- Responsive và accessible
- Dark mode support đầy đủ

**Pages cần redesign:**
- `src/pages/management/Dashboard.tsx` - Main dashboard
- `src/pages/management/Users.tsx` - User management
- `src/pages/management/Sessions.tsx` - Session management
- `src/pages/management/Classes.tsx` - Class management
- `src/pages/management/ReportsAnalytics.tsx` - Reports (đã có, cần cải thiện)
- `src/pages/management/Settings.tsx` - Settings page

**Design Guidelines:**
- Sử dụng cùng design system với student/tutor pages
- Card-based layout
- Consistent spacing và typography
- Icon usage consistent
- Color scheme: Blue primary, green success, red error, yellow warning

---

#### 5.2. UI/UX Mobile

**Yêu cầu:**
- Mobile-first design
- Touch-friendly
- Bottom navigation hoặc drawer menu
- Swipe gestures where appropriate

**Pages cần tạo:**
- `src/pages/management/DashboardMobile.tsx`
- `src/pages/management/UsersMobile.tsx`
- `src/pages/management/SessionsMobile.tsx`
- `src/pages/management/ClassesMobile.tsx`
- `src/pages/management/ReportsAnalyticsMobile.tsx` (đã có, cần cải thiện)
- `src/pages/management/SettingsMobile.tsx`

---

#### 5.3. Implement Đầy Đủ Chức Năng

**Yêu cầu từ mô tả và use case:**

1. **User Management:**
   - CRUD users (students, tutors, admins)
   - Bulk import/export users
   - User roles và permissions
   - User activity logs
   - Account suspension/activation

2. **Session Management:**
   - View all sessions
   - Filter và search
   - Manual session creation
   - Session conflict detection
   - Session analytics

3. **Class Management:**
   - CRUD classes
   - Class enrollment management
   - Class schedule management
   - Class analytics

4. **Content Management:**
   - Manage assignments
   - Manage quizzes
   - Manage course contents
   - Content approval workflow

5. **System Settings:**
   - System configuration
   - Email templates
   - Notification settings
   - Backup và restore

6. **Analytics & Reports:**
   - User statistics
   - Session statistics
   - Revenue reports (nếu có)
   - Performance metrics
   - Export reports (PDF/Excel)

**Implementation:**

**Backend APIs cần thêm:**
- `GET /api/admin/users` - List users với filters
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete/suspend user
- `POST /api/admin/users/bulk-import` - Bulk import
- `GET /api/admin/users/:id/activity` - User activity logs
- `GET /api/admin/sessions/analytics` - Session analytics
- `GET /api/admin/classes/analytics` - Class analytics
- `GET /api/admin/system/config` - Get system config
- `PUT /api/admin/system/config` - Update system config
- `POST /api/admin/backup` - Create backup
- `POST /api/admin/restore` - Restore from backup

**Files cần tạo:**
- `routes/admin/users/index.ts`
- `routes/admin/users/[id].ts`
- `routes/admin/users/bulk-import.ts`
- `routes/admin/analytics/sessions.ts`
- `routes/admin/analytics/classes.ts`
- `routes/admin/system/config.ts`
- `routes/admin/backup.ts`
- `src/pages/management/Users.tsx` (redesign)
- `src/pages/management/UsersMobile.tsx`
- `src/pages/management/ContentManagement.tsx`
- `src/pages/management/ContentManagementMobile.tsx`
- `src/pages/management/SystemSettings.tsx`
- `src/pages/management/SystemSettingsMobile.tsx`

---

## 👥 Phân Công Nhiệm Vụ Cho 5 Thành Viên

### **Thành Viên 1: Backend Developer - Core Features**

**Nhiệm vụ:**
1. ✅ **Fix Logic Cancel/Reschedule Class**
   - Implement logic xử lý conflict với lịch cố định hàng tuần
   - Update API endpoints cho class requests
   - Validate và batch update sessions

2. ✅ **Notification System**
   - Implement notification queue service
   - Tạo cron job để process queue
   - API endpoints cho notifications
   - Integrate với các modules khác (session requests, etc.)

3. ✅ **Progress Tracking Backend**
   - Implement progress service
   - API endpoints cho progress tracking
   - Data models và calculations

**Timeline:** Ngày 1-3

**Deliverables:**
- Updated `routes/session-requests/` với class logic
- `lib/services/notificationQueue.ts`
- `lib/cron/notificationCron.ts`
- `lib/services/progressService.ts`
- `routes/tutors/[id]/students/progress.ts`
- API documentation

---

### **Thành Viên 2: Backend Developer - Common Features**

**Nhiệm vụ:**
1. ✅ **Notification System Backend** (Ưu tiên cao)
   - Notification queue service
   - Cron job để process queue
   - API endpoints cho notifications

2. ✅ **Message Socket (WebSocket)** (Ưu tiên trung bình - có thể làm đơn giản)
   - Setup WebSocket server cơ bản
   - Implement real-time messaging đơn giản
   - Conversation và message APIs cơ bản
   - File attachment: tạm thời bỏ qua

3. ⚠️ **Digital Library Sync** (Ưu tiên thấp - có thể mock)
   - Mock library service (không cần sync thật)
   - Search logic đơn giản
   - API endpoints cơ bản

4. ⚠️ **Community Forum** (Ưu tiên thấp - có thể làm sau)
   - Forum post/answer APIs cơ bản
   - Voting system: tạm thời bỏ qua
   - Comment system cơ bản

**Timeline:** Ngày 1-4

**Deliverables:**
- `ws-server/index.ts`
- `lib/services/messageService.ts`
- `lib/services/libraryService.ts`
- `routes/conversations/`
- `routes/library/`
- `routes/forum/`

---

### **Thành Viên 3: Frontend Developer - Student & Tutor Features**

**Nhiệm vụ:**
1. ✅ **Fix Cancel/Reschedule Class UI**
   - Update RequestDialog component
   - Add UI cho phạm vi cancel/reschedule
   - Validation và error handling

2. ✅ **Student Progress Tracking Frontend**
   - Progress dashboard cho tutor (desktop)
   - Progress dashboard cho tutor (mobile)
   - Progress tab trong session/class detail
   - Charts và visualizations

3. ✅ **Message/Chat UI**
   - Chat window component
   - Conversation list
   - WebSocket integration
   - File upload UI

**Timeline:** Ngày 2-5

**Deliverables:**
- Updated `src/components/session/RequestDialog.tsx`
- `src/pages/tutor/StudentProgress.tsx` (desktop - cơ bản)
- `src/pages/tutor/StudentProgressMobile.tsx` (mobile - cơ bản)
- `src/components/message/ChatWindow.tsx` (cơ bản)
- `src/components/message/ConversationList.tsx` (cơ bản)
- `src/hooks/useWebSocket.ts`

---

### **Thành Viên 4: Frontend Developer - Common & Management Features**

**Nhiệm vụ:**
1. ✅ **Notification UI** (Ưu tiên cao)
   - Notification bell component
   - Notification list dropdown
   - Full notification page
   - Notification hook

2. ✅ **Management UI Redesign (Desktop)** (Ưu tiên cao)
   - Redesign dashboard
   - Redesign user management
   - Redesign session/class management
   - Redesign settings page

3. ⚠️ **Digital Library UI** (Ưu tiên trung bình - có thể làm đơn giản)
   - Library page (desktop) - cơ bản
   - Library page (mobile) - cơ bản
   - Material detail page - cơ bản

4. ⚠️ **Community Forum UI** (Ưu tiên thấp - có thể làm sau)
   - Forum main page (desktop) - cơ bản
   - Post detail page - cơ bản

**Timeline:** Ngày 3-6

**Deliverables:**
- `src/pages/common/DigitalLibrary.tsx`
- `src/pages/common/DigitalLibraryMobile.tsx`
- `src/pages/common/Forum.tsx`
- `src/pages/common/ForumMobile.tsx`
- `src/components/notification/NotificationBell.tsx`
- Redesigned management pages (desktop)

---

### **Thành Viên 5: Full-stack Developer - Testing & Management**

**Nhiệm vụ:**
1. ✅ **API Testing với pytest**
   - Setup test environment
   - Write test cases cho tất cả endpoints
   - Achieve 80%+ coverage
   - CI/CD integration

2. ✅ **Management Backend APIs**
   - Admin user management APIs
   - Analytics APIs
   - System settings APIs
   - Backup/restore APIs

3. ✅ **Management UI Mobile**
   - Mobile versions của tất cả management pages
   - Mobile navigation
   - Touch-friendly interactions

**Timeline:** Ngày 4-8

**Deliverables:**
- Test suite cơ bản (`tests/`) - ưu tiên critical endpoints
- `pytest.ini` hoặc `pyproject.toml`
- `routes/admin/` APIs - cơ bản (user management, analytics)
- `src/pages/management/*Mobile.tsx` pages - cơ bản
- Test coverage report (aim for 60%+ thay vì 80%)

---

## 📅 Timeline Tổng Thể (8 Ngày)

### **Ngày 1: Foundation & Core Logic**
- ✅ Thành viên 1: Fix cancel/reschedule class logic (backend)
- ✅ Thành viên 2: Notification system backend (queue + cron)
- ✅ Thành viên 3: Fix RequestDialog UI (frontend)
- ✅ Thành viên 4: Notification UI components
- ✅ Thành viên 5: Setup test environment + test critical auth endpoints

### **Ngày 2: Progress Tracking**
- ✅ Thành viên 1: Progress backend APIs
- ✅ Thành viên 2: Message socket setup (cơ bản)
- ✅ Thành viên 3: Progress UI (desktop + mobile cơ bản)
- ✅ Thành viên 4: Management UI redesign bắt đầu (dashboard)
- ✅ Thành viên 5: Test session/class endpoints

### **Ngày 3: Common Features Backend**
- ✅ Thành viên 1: Progress calculations và optimizations
- ✅ Thành viên 2: Message APIs + Library service (mock)
- ✅ Thành viên 3: Chat UI cơ bản
- ✅ Thành viên 4: Management UI (user management)
- ✅ Thành viên 5: Test request endpoints + Management APIs bắt đầu

### **Ngày 4: Common Features Frontend**
- ✅ Thành viên 1: Integrate notification với các modules
- ✅ Thành viên 2: Library APIs + Forum APIs (cơ bản)
- ✅ Thành viên 3: Chat UI hoàn thiện
- ✅ Thành viên 4: Management UI (session/class management)
- ✅ Thành viên 5: Management APIs (user management, analytics)

### **Ngày 5: Management & Integration**
- ✅ Thành viên 1: Finalize progress tracking
- ✅ Thành viên 2: Forum APIs hoàn thiện (nếu có thời gian)
- ✅ Thành viên 3: Library UI (cơ bản)
- ✅ Thành viên 4: Management UI (settings + mobile bắt đầu)
- ✅ Thành viên 5: Management APIs hoàn thiện + Mobile UI

### **Ngày 6: Mobile & Polish**
- ✅ Thành viên 1: Bug fixes và testing
- ✅ Thành viên 2: Bug fixes và testing
- ✅ Thành viên 3: Mobile UI polish
- ✅ Thành viên 4: Management mobile UI hoàn thiện
- ✅ Thành viên 5: Test suite (60%+ coverage)

### **Ngày 7: Testing & Bug Fixes**
- ✅ Tất cả: Integration testing
- ✅ Tất cả: Bug fixes
- ✅ Thành viên 5: Complete test suite (60%+ coverage)
- ✅ Tất cả: Code review và optimizations

### **Ngày 8: Final Review & Deployment**
- ✅ Tất cả: Final testing
- ✅ Tất cả: Documentation (tối thiểu)
- ✅ Tất cả: Final review
- ✅ Tất cả: Deployment prep và deploy

---

## 📊 Milestones (8 Ngày)

### **Milestone 1: Core Logic Fixes** (Ngày 1)
- ✅ Cancel/reschedule class logic hoàn thiện
- ✅ Notification system backend ready
- ✅ RequestDialog UI updated

### **Milestone 2: Progress Tracking** (Ngày 2-3)
- ✅ Progress backend APIs complete
- ✅ Progress UI (desktop + mobile) cơ bản
- ✅ Data sync working

### **Milestone 3: Common Features** (Ngày 3-4)
- ✅ Message socket working (cơ bản)
- ✅ Notification UI complete
- ✅ Library service (mock) ready

### **Milestone 4: Management Complete** (Ngày 4-5)
- ✅ Management APIs cơ bản complete
- ✅ Management UI (desktop) redesigned
- ✅ Management mobile UI cơ bản

### **Milestone 5: Testing & Deployment** (Ngày 7-8)
- ✅ 60%+ test coverage (critical endpoints)
- ✅ All critical bugs fixed
- ✅ Documentation tối thiểu
- ✅ Ready for deployment

---

## 🔧 Technical Stack

### **Backend:**
- Node.js + Express
- TypeScript
- Vercel Blob Storage
- WebSocket (Socket.io hoặc native)
- Cron jobs (node-cron)

### **Frontend:**
- React + TypeScript
- Material-UI (MUI)
- Tailwind CSS
- React Router
- Socket.io Client (cho WebSocket)

### **Testing:**
- pytest
- pytest-asyncio
- pytest-cov
- httpx hoặc requests

### **Tools:**
- Git/GitHub
- Vercel (deployment)
- Postman/Insomnia (API testing)

---

## 📝 Notes

1. **Communication:**
   - Daily standup (15 phút) - BẮT BUỘC mỗi ngày
   - End-of-day sync (30 phút) - Review progress và blockers
   - Use GitHub Issues để track tasks
   - Use Pull Requests cho code review (nhanh, không cần quá chi tiết)

2. **Code Quality:**
   - Follow TypeScript best practices
   - Write meaningful commit messages
   - Code review required trước khi merge
   - Maintain consistent code style

3. **Documentation:**
   - API documentation (Swagger/OpenAPI)
   - Component documentation
   - Setup instructions
   - Deployment guide

4. **Testing:**
   - Write tests cho critical endpoints trước
   - Aim for 60%+ coverage (do thời gian hạn chế)
   - Test critical flows và edge cases
   - Integration tests cho main user flows

---

## ✅ Checklist Hoàn Thành

### **STUDENT:**
- [ ] Fix cancel/reschedule class logic
- [ ] Update RequestDialog UI
- [ ] Test class request scenarios

### **TUTOR:**
- [ ] Progress tracking backend
- [ ] Progress tracking UI (desktop)
- [ ] Progress tracking UI (mobile)
- [ ] Data sync working

### **TEST CASE:**
- [ ] Test setup complete
- [ ] Auth tests (critical)
- [ ] Session tests (critical)
- [ ] Class tests (critical)
- [ ] Request tests (critical)
- [ ] Progress tests (nếu có thời gian)
- [ ] 60%+ coverage achieved (critical endpoints)

### **COMMON:**
- [ ] Message socket working (cơ bản)
- [ ] Library service (mock) working
- [ ] Forum functionality (cơ bản - nếu có thời gian)
- [ ] Notification system working
- [ ] Notification UI complete

### **MANAGEMENT:**
- [ ] Desktop UI redesigned
- [ ] Mobile UI complete
- [ ] All APIs implemented
- [ ] All features working
- [ ] Analytics complete

---

**Last Updated:** [Date]
**Version:** 2.0
**Status:** In Progress - 8 Days Deadline
**Note:** Timeline đã được điều chỉnh từ 8 tuần xuống 8 ngày. Một số features có thể được làm đơn giản hóa hoặc tạm thời bỏ qua để đảm bảo deadline.

