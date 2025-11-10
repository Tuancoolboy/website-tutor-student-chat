/**
 * Express API Server
 * Main server file for Tutor Support System APIs
 */

import express from 'express';
import cors from 'cors';
import { config } from './lib/config.js';
import { authenticate, authorize, validateBody, errorHandler } from './lib/middleware.js';
import { loginSchema, registerSchema, updateProfileSchema, createClassSchema, updateClassSchema, createEnrollmentSchema, updateEnrollmentSchema, createSessionRequestSchema, approveSessionRequestSchema, rejectSessionRequestSchema, createForumPostSchema } from './lib/schemas.js';
import { UserRole } from './lib/types.js';

// Import handlers - Auth
import { loginHandler } from './routes/auth/login.js';
import { registerHandler } from './routes/auth/register.js';
import { meHandler } from './routes/auth/me.js';
import { refreshTokenHandler } from './routes/auth/refresh.js';
import { logoutHandler } from './routes/auth/logout.js';

// Import handlers - Users
import { listUsersHandler } from './routes/users/index.js';
import { getUserHandler, updateUserHandler, deleteUserHandler } from './routes/users/[id].js';

// Import handlers - Tutors & Students
import { listTutorsHandler } from './routes/tutors/index.js';
import { getTutorHandler, getTutorReviewsHandler } from './routes/tutors/[id].js';
import { getStudentHandler, getStudentSessionsHandler } from './routes/students/[id].js';

// Import handlers - Sessions
import { listSessionsHandler, createSessionHandler } from './routes/sessions/index.js';
import { getSessionHandler, updateSessionHandler, cancelSessionHandler, rescheduleSessionHandler } from './routes/sessions/[id].js';

// Import handlers - Course Contents, Quizzes, Assignments
import { getCourseContentsHandler, createCourseContentHandler, updateCourseContentHandler, deleteCourseContentHandler } from './routes/sessions/[id]/course-contents.js';
import { getQuizzesHandler, createQuizHandler, updateQuizHandler, deleteQuizHandler, submitQuizHandler, getQuizSubmissionsHandler } from './routes/sessions/[id]/quizzes.js';
import { getAssignmentsHandler, createAssignmentHandler, updateAssignmentHandler, deleteAssignmentHandler, submitAssignmentHandler } from './routes/sessions/[id]/assignments.js';
import { getSubmissionsHandler, gradeSubmissionHandler } from './routes/sessions/[id]/submissions.js';
import { getGradesHandler, getGradesSummaryHandler } from './routes/sessions/[id]/grades.js';
import { getSessionStudentsHandler, addStudentToSessionHandler, removeStudentFromSessionHandler } from './routes/sessions/[id]/students.js';

// Import handlers - Calendar & Availability
import { getCalendarHandler } from './routes/calendar/[userId].js';
import { getAvailabilityHandler, setAvailabilityHandler, updateAvailabilityHandler } from './routes/availability/index.js';

// Import handlers - Classes & Enrollments
import { listClassesHandler, createClassHandler } from './routes/classes/index.js';
import { getClassHandler, updateClassHandler, deleteClassHandler } from './routes/classes/[id].js';
import { generateSessionsHandler } from './routes/classes/[id]/generate-sessions.js';
import { listEnrollmentsHandler, createEnrollmentHandler } from './routes/enrollments/index.js';
import { getEnrollmentHandler, updateEnrollmentHandler, deleteEnrollmentHandler } from './routes/enrollments/[id].js';

// Import handlers - Notifications
import { getNotificationsHandler, markAsReadHandler, deleteNotificationHandler } from './routes/notifications/index.js';

// Import handlers - Progress
import { listProgressHandler, createProgressHandler, getProgressHandler } from './routes/progress/index.js';

// Import handlers - Evaluations
import { listEvaluationsHandler, createEvaluationHandler, getEvaluationHandler, updateEvaluationHandler, deleteEvaluationHandler } from './routes/evaluations/index.js';

// Import handlers - Forum
import { listPostsHandler, createPostHandler, getPostHandler, updatePostHandler, deletePostHandler, likePostHandler } from './routes/forum/posts.js';
import { getCommentsHandler, createCommentHandler, deleteCommentHandler } from './routes/forum/comments.js';

// Import handlers - Session Requests
import { listSessionRequestsHandler, createSessionRequestHandler } from './routes/session-requests/index.js';
import { getSessionRequestHandler, approveSessionRequestHandler, rejectSessionRequestHandler, withdrawSessionRequestHandler } from './routes/session-requests/[id].js';
import { getAlternativeSessionsHandler } from './routes/session-requests/alternatives.js';

// Import handlers - Conversations & Messages
import { listConversationsHandler, createConversationHandler, getConversationHandler, deleteConversationHandler } from './routes/conversations/index.js';
import { getMessagesHandler, sendMessageHandler, markMessageReadHandler } from './routes/conversations/[id]/messages.js';
import { pollMessagesHandler } from './routes/messages/poll.js';
import { sendMessageToUserHandler } from './routes/messages/send.js';

// Create Express app
const app = express();

// Note: Socket.io is NOT supported on Vercel Serverless Functions
// WebSocket server must be deployed separately on Railway, Render, etc.
// See ws-server.ts for the WebSocket server implementation

// Middleware
// CORS configuration - allow all origins in production (Vercel)
// In development, use config.frontend.url
const corsOptions = {
  origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' || process.env.VERCEL ? '*' : config.frontend.url),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2kb' }));
app.use(express.urlencoded({ extended: true, limit: '2kb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
// Support both /health and /api/health for compatibility
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ===== AUTHENTICATION ROUTES =====

app.post('/api/auth/login', validateBody(loginSchema), loginHandler);
app.post('/api/auth/register', validateBody(registerSchema), registerHandler);
app.post('/api/auth/logout', authenticate, logoutHandler);
app.get('/api/auth/me', authenticate, meHandler);
app.post('/api/auth/refresh-token', refreshTokenHandler);

// ===== USER MANAGEMENT ROUTES =====

app.get('/api/users', authenticate, listUsersHandler);
app.get('/api/users/:id', authenticate, getUserHandler);
app.put('/api/users/:id', authenticate, validateBody(updateProfileSchema), updateUserHandler);
app.delete('/api/users/:id', authenticate, authorize(UserRole.MANAGEMENT), deleteUserHandler);

// ===== TUTOR ROUTES =====

app.get('/api/tutors', listTutorsHandler);
app.get('/api/tutors/:id', getTutorHandler);
app.get('/api/tutors/:id/reviews', getTutorReviewsHandler);

// ===== STUDENT ROUTES =====

app.get('/api/students/:id', authenticate, getStudentHandler);
app.get('/api/students/:id/sessions', authenticate, getStudentSessionsHandler);

// ===== SESSION ROUTES =====

app.get('/api/sessions', authenticate, listSessionsHandler);
app.post('/api/sessions', authenticate, createSessionHandler);
app.get('/api/sessions/:id', authenticate, getSessionHandler);
app.put('/api/sessions/:id', authenticate, updateSessionHandler);
app.delete('/api/sessions/:id', authenticate, cancelSessionHandler);
app.post('/api/sessions/:id/reschedule', authenticate, rescheduleSessionHandler);

// Session-specific routes: Course Contents
app.get('/api/sessions/:id/course-contents', authenticate, getCourseContentsHandler);
app.post('/api/sessions/:id/course-contents', authenticate, createCourseContentHandler);
app.put('/api/sessions/:id/course-contents/:contentId', authenticate, updateCourseContentHandler);
app.delete('/api/sessions/:id/course-contents/:contentId', authenticate, deleteCourseContentHandler);

// Session-specific routes: Quizzes
app.get('/api/sessions/:id/quizzes', authenticate, getQuizzesHandler);
app.post('/api/sessions/:id/quizzes', authenticate, createQuizHandler);
app.put('/api/sessions/:id/quizzes/:quizId', authenticate, updateQuizHandler);
app.delete('/api/sessions/:id/quizzes/:quizId', authenticate, deleteQuizHandler);
app.get('/api/sessions/:id/quizzes/:quizId/submissions', authenticate, getQuizSubmissionsHandler);
app.post('/api/sessions/:id/quizzes/:quizId/submit', authenticate, submitQuizHandler);

// Session-specific routes: Assignments
app.get('/api/sessions/:id/assignments', authenticate, getAssignmentsHandler);
app.post('/api/sessions/:id/assignments', authenticate, createAssignmentHandler);
app.put('/api/sessions/:id/assignments/:assignmentId', authenticate, updateAssignmentHandler);
app.delete('/api/sessions/:id/assignments/:assignmentId', authenticate, deleteAssignmentHandler);
app.post('/api/sessions/:id/assignments/:assignmentId/submit', authenticate, submitAssignmentHandler);

// Session-specific routes: Submissions & Grading
app.get('/api/sessions/:id/submissions', authenticate, getSubmissionsHandler);
app.put('/api/sessions/:id/submissions/:submissionId/grade', authenticate, gradeSubmissionHandler);

// Session-specific routes: Grades
app.get('/api/sessions/:id/grades', authenticate, getGradesHandler);
app.get('/api/sessions/:id/grades/summary', authenticate, getGradesSummaryHandler);

// Session-specific routes: Students
app.get('/api/sessions/:id/students', authenticate, getSessionStudentsHandler);
app.post('/api/sessions/:id/students', authenticate, addStudentToSessionHandler);
app.delete('/api/sessions/:id/students/:studentId', authenticate, removeStudentFromSessionHandler);

// ===== CALENDAR & AVAILABILITY ROUTES =====

app.get('/api/calendar/:userId', authenticate, getCalendarHandler);
app.get('/api/availability/:tutorId', getAvailabilityHandler);
app.post('/api/availability', authenticate, setAvailabilityHandler);
app.put('/api/availability/:id', authenticate, updateAvailabilityHandler);

// ===== CLASSES ROUTES =====

app.get('/api/classes', listClassesHandler);
app.post('/api/classes', authenticate, validateBody(createClassSchema), createClassHandler);
app.get('/api/classes/:id', getClassHandler);
app.put('/api/classes/:id', authenticate, validateBody(updateClassSchema), updateClassHandler);
app.delete('/api/classes/:id', authenticate, deleteClassHandler);
app.post('/api/classes/:id/generate-sessions', authenticate, generateSessionsHandler);

// ===== ENROLLMENTS ROUTES =====

app.get('/api/enrollments', authenticate, listEnrollmentsHandler);
app.post('/api/enrollments', authenticate, validateBody(createEnrollmentSchema), createEnrollmentHandler);
app.get('/api/enrollments/:id', authenticate, getEnrollmentHandler);
app.put('/api/enrollments/:id', authenticate, validateBody(updateEnrollmentSchema), updateEnrollmentHandler);
app.delete('/api/enrollments/:id', authenticate, deleteEnrollmentHandler);

// ===== NOTIFICATIONS ROUTES =====

app.get('/api/notifications', authenticate, getNotificationsHandler);
app.put('/api/notifications/:id/read', authenticate, markAsReadHandler);
app.delete('/api/notifications/:id', authenticate, deleteNotificationHandler);

// ===== PROGRESS ROUTES =====

app.get('/api/progress', authenticate, listProgressHandler);
app.post('/api/progress', authenticate, createProgressHandler);
app.get('/api/progress/:id', authenticate, getProgressHandler);

// ===== EVALUATIONS ROUTES =====

app.get('/api/evaluations', authenticate, listEvaluationsHandler);
app.post('/api/evaluations', authenticate, createEvaluationHandler);
app.get('/api/evaluations/:id', authenticate, getEvaluationHandler);
app.put('/api/evaluations/:id', authenticate, updateEvaluationHandler);
app.delete('/api/evaluations/:id', authenticate, deleteEvaluationHandler);

// ===== FORUM ROUTES =====

app.get('/api/forum/posts', listPostsHandler);
app.post('/api/forum/posts', authenticate, validateBody(createForumPostSchema), createPostHandler);
app.get('/api/forum/posts/:id', getPostHandler);
app.put('/api/forum/posts/:id', authenticate, updatePostHandler);
app.delete('/api/forum/posts/:id', authenticate, deletePostHandler);
app.post('/api/forum/posts/:id/like', authenticate, likePostHandler);
app.get('/api/forum/posts/:id/comments', getCommentsHandler);
app.post('/api/forum/posts/:id/comments', authenticate, createCommentHandler);
app.delete('/api/forum/comments/:id', authenticate, deleteCommentHandler);

// ===== SESSION REQUESTS ROUTES =====

app.get('/api/session-requests', authenticate, listSessionRequestsHandler);
app.get('/api/session-requests/alternatives', authenticate, getAlternativeSessionsHandler);
app.post('/api/session-requests', authenticate, validateBody(createSessionRequestSchema), createSessionRequestHandler);
app.get('/api/session-requests/:id', authenticate, getSessionRequestHandler);
app.put('/api/session-requests/:id/approve', authenticate, validateBody(approveSessionRequestSchema), approveSessionRequestHandler);
app.put('/api/session-requests/:id/reject', authenticate, validateBody(rejectSessionRequestSchema), rejectSessionRequestHandler);
app.delete('/api/session-requests/:id', authenticate, withdrawSessionRequestHandler);

// ===== CONVERSATIONS & MESSAGES ROUTES =====

app.get('/api/conversations', authenticate, listConversationsHandler);
app.post('/api/conversations', authenticate, createConversationHandler);
app.get('/api/conversations/:id', authenticate, getConversationHandler);
app.delete('/api/conversations/:id', authenticate, deleteConversationHandler);
app.get('/api/conversations/:id/messages', authenticate, getMessagesHandler);
app.post('/api/conversations/:id/messages', authenticate, sendMessageHandler);
app.put('/api/messages/:id/read', authenticate, markMessageReadHandler);

// Long polling endpoint (free alternative to WebSocket)
app.get('/api/messages/poll', authenticate, pollMessagesHandler);

// Send message directly to user (auto-create conversation)
app.post('/api/messages/send', authenticate, sendMessageToUserHandler);

// ===== ERROR HANDLING =====

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use(errorHandler);

// Start server
// Note: For WebSocket support, deploy ws-server.ts separately on Railway/Render
// On Render/Railway, this will run as a traditional server
// On Vercel, this file is used as a serverless function handler (via api/index.ts)
// Vercel serverless functions don't call app.listen(), they use app as a handler

// Only start server if not running on Vercel (serverless)
// Vercel sets VERCEL environment variable
if (!process.env.VERCEL) {
  const PORT = config.api.port;
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           🎓 Tutor Support System API Server                ║
║                                                              ║
║  Status: ✅ Running                                          ║
║  Port: ${PORT}                                                  ║
║  Environment: ${config.env}                               ║
║                                                              ║
║  API Base: http://localhost:${PORT}/api                       ║
║  Health Check: http://localhost:${PORT}/health                ║
║                                                              ║
║  Note: WebSocket server must be deployed separately          ║
║        See ws-server.ts for WebSocket implementation         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
}

export default app;

