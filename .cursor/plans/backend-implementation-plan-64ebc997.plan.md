<!-- 64ebc997-34e2-44c0-9988-a595272100a3 225c77ae-d4b8-455c-8888-9130ffbfa504 -->
# Kế hoạch Triển khai Backend - Tutor Support System

## 🎯 Tổng quan

**Timeline:** 3 tuần (21 ngày)

**Team size:** 6 người

**Tech stack:** Next.js API Routes + Node.js WebSocket Server + JSON Storage

**Deployment:** Vercel (API) + Railway (WebSocket)

## 📦 Kiến trúc hệ thống

### Backend Components

1. **Next.js API Routes** (Vercel) - REST APIs cho tất cả features
2. **Node.js WebSocket Server** (Railway) - Real-time Messages
3. **JSON Storage** (Vercel Blob Storage) - Database với CRUD operations
4. **Mock Services** - Giả lập HCMUT_SSO, DATACORE, LIBRARY

### Data Structure (JSON Files)

```
data/
├── users.json          # Students, Tutors, Management
├── sessions.json       # Tutoring sessions
├── messages.json       # Chat messages
├── notifications.json  # User notifications
├── availability.json   # Tutor availability
├── evaluations.json    # Session evaluations
├── progress.json       # Student progress tracking
├── library.json        # Library resources
├── forum.json          # Forum posts & comments
├── analytics.json      # System analytics data
└── approvals.json      # Approval requests
```

## 👥 Phân chia Team & Nhiệm vụ

### **Team A - Core APIs** (Person 1 & 2)

- Authentication & Authorization (Mock HCMUT_SSO)
- User Management (CRUD for Students, Tutors, Management)
- Session Management (Book, View, Update, Cancel, Reschedule)
- Calendar & Availability APIs

### **Team B - Feature APIs** (Person 3 & 4)

- Notifications System (Polling-based)
- Digital Library Access (Mock HCMUT_LIBRARY)
- Forum APIs (Posts, Comments, Threads)
- Progress Tracking & Evaluations

### **Team C - Real-time** (Person 5)

- WebSocket Server setup (Railway)
- Real-time Messages implementation
- Socket authentication & room management
- Integration với Next.js frontend

### **Team D - Advanced Features** (Person 6)

- AI Matching Algorithm
- Analytics & Reports APIs
- Dashboard statistics
- Data aggregation services

## 📅 Timeline Chi tiết - 3 Tuần

### **TUẦN 1: Foundation & Core APIs** (Ngày 1-7)

#### Ngày 1-2: Setup Project

**Team A:**

- Setup Next.js project với folder structure: `/app/api/`
- Tạo JSON storage utilities (`lib/storage.ts`)
- Setup Vercel Blob Storage integration
- Mock data generators

**Team B:**

- Tạo tất cả JSON data files với seed data
- Define TypeScript interfaces cho tất cả entities
- Setup validation schemas (Zod)

**Team C:**

- Setup Node.js WebSocket server project
- Install dependencies: `socket.io`, `express`, `cors`
- Basic server structure

**Team D:**

- Research AI matching algorithms
- Define analytics data models
- Setup utility functions

#### Ngày 3-4: Authentication & Users

**Team A:**

```typescript
// API endpoints cần implement:
POST   /api/auth/login              # Mock HCMUT_SSO login
POST   /api/auth/register           # User registration
POST   /api/auth/logout
GET    /api/auth/me                 # Current user info
POST   /api/auth/refresh-token

GET    /api/users                   # List users (with filters)
GET    /api/users/:id               # User detail
PUT    /api/users/:id               # Update profile
DELETE /api/users/:id

GET    /api/tutors                  # List tutors
GET    /api/tutors/:id
GET    /api/tutors/:id/reviews

GET    /api/students/:id
GET    /api/students/:id/sessions
```

**Team B:**

- Hỗ trợ Team A test APIs
- Chuẩn bị data cho features APIs

**Team C:**

- WebSocket authentication middleware
- Socket connection handling
- Basic message events

**Team D:**

- Define matching algorithm criteria
- Create scoring functions

#### Ngày 5-7: Sessions & Calendar

**Team A:**

```typescript
// Sessions APIs:
POST   /api/sessions                # Book new session
GET    /api/sessions                # List sessions (filtered)
GET    /api/sessions/:id            # Session detail
PUT    /api/sessions/:id            # Update session
DELETE /api/sessions/:id            # Cancel session
POST   /api/sessions/:id/reschedule # Reschedule session

// Calendar APIs:
GET    /api/calendar/:userId        # User calendar
GET    /api/availability/:tutorId   # Tutor availability
POST   /api/availability            # Set availability
PUT    /api/availability/:id        # Update availability
```

**Team B:**

- Start Notifications APIs
- Start Forum APIs

**Team C:**

- Message room creation
- Real-time message sending/receiving
- Message history loading

**Team D:**

- Implement basic AI matching
- Start analytics data collection

### **TUẦN 2: Feature APIs & Integration** (Ngày 8-14)

#### Ngày 8-10: Messages & Notifications

**Team C:**

```typescript
// WebSocket Server (ws-server/):
io.on('connection', (socket) => {
  // Events:
  'join-room'
  'leave-room'
  'send-message'
  'typing'
  'message-read'
  'user-online'
  'user-offline'
});

// REST APIs for message history:
GET    /api/messages/conversations  # List conversations
GET    /api/messages/:conversationId # Message history
POST   /api/messages                # Send message (backup)
DELETE /api/messages/:id            # Delete message
```

**Team B:**

```typescript
// Notifications APIs:
GET    /api/notifications           # User notifications
POST   /api/notifications           # Create notification
PUT    /api/notifications/:id/read  # Mark as read
DELETE /api/notifications/:id

// System notifications triggers:
- Session booking confirmed
- Session reminder (1 hour before)
- Session cancelled/rescheduled
- New message (when offline)
- Evaluation request
```

**Team A:**

- Support Team C với authentication
- Refine Sessions APIs

**Team D:**

- Analytics event logging
- Basic reports generation

#### Ngày 11-12: Library & Forum

**Team B:**

```typescript
// Digital Library (Mock HCMUT_LIBRARY):
GET    /api/library/resources       # List resources
GET    /api/library/resources/:id   # Resource detail
GET    /api/library/search          # Search resources
POST   /api/library/share           # Share resource

// Forum APIs:
GET    /api/forum/posts             # List posts
POST   /api/forum/posts             # Create post
GET    /api/forum/posts/:id         # Post detail
PUT    /api/forum/posts/:id
DELETE /api/forum/posts/:id

POST   /api/forum/posts/:id/comments # Add comment
GET    /api/forum/posts/:id/comments # List comments
DELETE /api/forum/comments/:id

POST   /api/forum/posts/:id/like    # Like/unlike
```

**Team A:**

- Integration testing với frontend
- Bug fixes

**Team C:**

- WebSocket testing & optimization
- Connection stability improvements

**Team D:**

- Continue AI matching refinement

#### Ngày 13-14: Progress & Evaluations

**Team B:**

```typescript
// Progress Tracking:
GET    /api/progress/:studentId     # Student progress
POST   /api/progress                # Log progress
PUT    /api/progress/:id            # Update progress
GET    /api/progress/:studentId/stats # Progress statistics

// Evaluations:
POST   /api/evaluations             # Submit evaluation
GET    /api/evaluations/session/:id # Session evaluations
GET    /api/evaluations/tutor/:id   # Tutor evaluations
GET    /api/evaluations/student/:id # Student evaluations
PUT    /api/evaluations/:id         # Update evaluation
```

**Team A:**

- Search tutors với filters
- Advanced session queries

**Team C:**

- Deploy WebSocket server to Railway
- Setup environment variables

**Team D:**

- AI matching API implementation
- Testing matching algorithm

### **TUẦN 3: Advanced Features & Deployment** (Ngày 15-21)

#### Ngày 15-16: AI Matching & Search

**Team D:**

```typescript
// AI Matching APIs:
POST   /api/ai/match-tutors         # Get matched tutors
GET    /api/ai/recommendations/:id  # Personalized recommendations
POST   /api/ai/feedback             # Improve matching

// Algorithm considers:
- Subject match (40%)
- Availability compatibility (25%)
- Rating & reviews (20%)
- Student preferences & history (15%)

// Implementation:
interface MatchScore {
  tutorId: string;
  score: number;
  reasons: string[];
}

function calculateMatch(
  student: Student,
  tutor: Tutor,
  filters: SearchFilters
): MatchScore { ... }
```

**Team A:**

```typescript
// Enhanced Search:
GET /api/tutors/search?
  subject=math&
  rating=4.5&
  availability=today&
  priceRange=0-100&
  location=hcmc&
  useAI=true
```

**Team B:**

- Polish all feature APIs
- Documentation

**Team C:**

- WebSocket performance testing
- Error handling improvements

#### Ngày 17-18: Analytics & Reports

**Team D:**

```typescript
// Management Analytics:
GET    /api/analytics/dashboard     # Overview stats
GET    /api/analytics/sessions      # Session analytics
GET    /api/analytics/tutors        # Tutor performance
GET    /api/analytics/students      # Student engagement
GET    /api/analytics/revenue       # Financial reports

// Reports:
GET    /api/reports/monthly         # Monthly report
GET    /api/reports/tutor/:id       # Tutor report
GET    /api/reports/export          # Export CSV/PDF

// Approval Requests (Management):
GET    /api/approvals               # List requests
POST   /api/approvals               # Create request
PUT    /api/approvals/:id/approve   # Approve
PUT    /api/approvals/:id/reject    # Reject
```

**Team A, B, C:**

- Integration testing
- Frontend-Backend integration testing
- Bug fixes

#### Ngày 19-20: Testing & Polish

**All Teams:**

- End-to-end testing
- Load testing (với mock data)
- Security testing
- API documentation finalization
- Error handling improvements
- Response time optimization

**Testing Checklist:**

- [ ] Authentication flow
- [ ] Session booking flow
- [ ] Real-time messaging
- [ ] Notifications delivery
- [ ] AI matching accuracy
- [ ] Analytics calculation
- [ ] File operations (JSON CRUD)
- [ ] Error scenarios
- [ ] Edge cases

#### Ngày 21: Deployment & Documentation

**Team A:**

- Deploy Next.js to Vercel
- Configure Vercel Blob Storage
- Setup environment variables
- Domain configuration

**Team C:**

- Finalize Railway deployment
- Configure WebSocket URLs
- Test production WebSocket connection

**Team B:**

- API documentation (Swagger/Postman)
- Create user guide
- Setup monitoring

**Team D:**

- Performance monitoring setup
- Analytics dashboard verification

**All Teams:**

- Final testing on production
- Prepare demo
- Documentation review

## 🔧 Technical Implementation Details

### 1. JSON Storage với Vercel Blob

```typescript
// lib/storage.ts
import { put, get } from '@vercel/blob';

export class JSONStorage {
  async read(filename: string) {
    const blob = await get(`data/${filename}`);
    return JSON.parse(await blob.text());
  }

  async write(filename: string, data: any) {
    await put(`data/${filename}`, JSON.stringify(data, null, 2), {
      access: 'public',
    });
  }

  async update(filename: string, id: string, updates: any) {
    const data = await this.read(filename);
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates };
      await this.write(filename, data);
    }
    return data[index];
  }
}
```

### 2. Mock HCMUT_SSO

```typescript
// lib/mock-sso.ts
export function mockHCMUT_SSO_Login(email: string, password: string) {
  // Simulate SSO authentication
  if (email.endsWith('@hcmut.edu.vn')) {
    return {
      success: true,
      token: generateJWT({ email, role: determineRole(email) }),
      user: {
        email,
        name: extractNameFromEmail(email),
        hcmutId: generateHCMUTId(),
        role: determineRole(email)
      }
    };
  }
  return { success: false, error: 'Invalid HCMUT credentials' };
}
```

### 3. WebSocket Server Structure

```javascript
// ws-server/index.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

io.use(authenticateSocket); // JWT verification

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  socket.on('join-room', (conversationId) => {
    socket.join(conversationId);
  });
  
  socket.on('send-message', async (data) => {
    // Save to JSON
    // Broadcast to room
    io.to(data.conversationId).emit('new-message', message);
  });
});

server.listen(process.env.PORT || 3001);
```

### 4. AI Matching Algorithm

```typescript
// lib/ai-matching.ts
interface MatchingFactors {
  subjectMatch: number;      // 0-40
  availabilityMatch: number; // 0-25
  ratingScore: number;       // 0-20
  profileMatch: number;      // 0-15
}

export function calculateMatchScore(
  student: Student,
  tutor: Tutor,
  filters: SearchFilters
): number {
  const factors: MatchingFactors = {
    subjectMatch: calculateSubjectMatch(student, tutor, filters),
    availabilityMatch: calculateAvailabilityMatch(student, tutor),
    ratingScore: normalizeRating(tutor.rating),
    profileMatch: calculateProfileMatch(student, tutor)
  };
  
  return Object.values(factors).reduce((sum, score) => sum + score, 0);
}
```

## 🚀 Deployment Configuration

### Vercel Setup (Next.js API)

```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "BLOB_READ_WRITE_TOKEN": "@blob_token",
    "JWT_SECRET": "@jwt_secret",
    "WEBSOCKET_URL": "@ws_url"
  }
}
```

### Railway Setup (WebSocket)

```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node index.js"
restartPolicyType = "ON_FAILURE"

[env]
PORT = "3001"
FRONTEND_URL = "https://your-app.vercel.app"
```

## 📝 API Documentation Format

Mỗi API endpoint cần document:

- Method & URL
- Authentication required?
- Request parameters/body
- Response format
- Error codes
- Example usage

## ✅ Definition of Done

Một feature được coi là hoàn thành khi:

- [ ] API endpoint hoạt động đúng
- [ ] JSON storage CRUD working
- [ ] Error handling implemented
- [ ] TypeScript types defined
- [ ] Tested với Postman/Thunder Client
- [ ] Frontend integration successful
- [ ] Code reviewed by team lead
- [ ] Documented

## 🎯 Success Metrics

- **Week 1:** Core APIs (Auth, Users, Sessions) working - 35% complete
- **Week 2:** All feature APIs + WebSocket working - 75% complete  
- **Week 3:** AI, Analytics, deployed to production - 100% complete

## 📞 Daily Standup Format

**Mỗi ngày lúc 9:00 AM:**

- What did you complete yesterday?
- What will you work on today?
- Any blockers?

## 🆘 Risk Management

**Rủi ro cao:**

- Vercel Blob Storage quota limits → Backup: Use static JSON in repo
- WebSocket Railway downtime → Backup: Fallback to polling
- AI matching complexity → Start with simple scoring

**Mitigation:**

- Daily integration testing
- Keep JSON files small (<5MB each)
- Comprehensive error handling
- Regular backups

---

**Lưu ý quan trọng:** Đây là kế hoạch aggressive cho 3 tuần. Team cần làm việc focused và có communication tốt. Nếu gặp khó khăn, ưu tiên Core APIs trước, Advanced features sau.

### To-dos

- [ ] Setup Next.js project structure, JSON storage utilities, và WebSocket server foundation
- [ ] Implement Authentication (Mock SSO) và User Management APIs
- [ ] Implement Sessions và Calendar/Availability APIs
- [ ] Implement WebSocket server và Real-time Messages
- [ ] Implement Notifications system (polling-based)
- [ ] Implement Digital Library (mock) và Forum APIs
- [ ] Implement Progress Tracking và Evaluations APIs
- [ ] Implement AI Matching Algorithm và Recommendations
- [ ] Implement Analytics dashboard và Reports APIs
- [ ] End-to-end testing, Frontend-Backend integration, và bug fixes
- [ ] Deploy Next.js to Vercel, WebSocket to Railway, và final testing