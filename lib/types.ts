// ===== ENUMS & CONSTANTS =====

export enum UserRole {
  STUDENT = 'student',
  TUTOR = 'tutor',
  MANAGEMENT = 'management'
}

export enum SessionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled'
}

export enum NotificationType {
  SESSION_BOOKING = 'session_booking',
  SESSION_REMINDER = 'session_reminder',
  SESSION_CANCELLED = 'session_cancelled',
  SESSION_RESCHEDULED = 'session_rescheduled',
  SESSION_CANCEL_REQUEST = 'session_cancel_request',
  SESSION_RESCHEDULE_REQUEST = 'session_reschedule_request',
  NEW_MESSAGE = 'new_message',
  EVALUATION_REQUEST = 'evaluation_request',
  SYSTEM = 'system'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum RequestType {
  CANCEL = 'cancel',
  RESCHEDULE = 'reschedule'
}

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn'
}

// ===== USER ENTITIES =====

export interface BaseUser {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  hcmutId: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student extends BaseUser {
  role: UserRole.STUDENT;
  major?: string;
  year?: number;
  interests?: string[];
  preferredSubjects?: string[];
}

export interface Tutor extends BaseUser {
  role: UserRole.TUTOR;
  subjects: string[];
  bio?: string;
  rating: number;
  totalSessions: number;
  availability: string[]; // array of time slots
  verified: boolean;
  credentials?: string[];
}

export interface Management extends BaseUser {
  role: UserRole.MANAGEMENT;
  department?: string;
  permissions: string[];
}

export type User = Student | Tutor | Management;

// ===== SESSION ENTITIES =====

export interface Session {
  id: string;
  studentIds: string[]; // Changed from studentId to support multiple students
  tutorId: string;
  subject: string;
  topic?: string;
  description?: string;
  status: SessionStatus;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  location?: string;
  isOnline: boolean;
  meetingLink?: string;
  notes?: string;
  classId?: string; // Link to Class for recurring sessions
  createdAt: string;
  updatedAt: string;
  cancelledBy?: string;
  cancelReason?: string;
  rescheduledFrom?: string;
}

// ===== AVAILABILITY =====

export interface TimeSlot {
  day: string; // 'monday', 'tuesday', etc.
  startTime: string; // '09:00'
  endTime: string; // '17:00'
}

export interface Availability {
  id: string;
  tutorId: string;
  timeSlots: TimeSlot[];
  exceptions?: {
    date: string;
    reason: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ===== CLASS & ENROLLMENT =====

export enum ClassStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FULL = 'full'
}

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
  CANCELLED = 'cancelled'
}

export interface Class {
  id: string;
  code: string; // C01, C02, etc.
  tutorId: string;
  subject: string;
  description?: string;
  day: string; // 'monday', 'tuesday', etc.
  startTime: string; // '08:00'
  endTime: string; // '10:00'
  duration: number; // minutes
  maxStudents: number; // capacity
  currentEnrollment: number; // số students hiện tại
  status: ClassStatus;
  semesterStart: string; // ISO date
  semesterEnd: string; // ISO date
  isOnline: boolean;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
  droppedAt?: string;
  notes?: string;
}

// ===== MESSAGES =====

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // user IDs
  lastMessage?: Message;
  unreadCount: { [userId: string]: number };
  hiddenFor?: string[]; // user IDs who have hidden this conversation
  createdAt: string;
  updatedAt: string;
}

// ===== NOTIFICATIONS =====

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: any;
  createdAt: string;
}

// ===== EVALUATIONS =====

export interface Evaluation {
  id: string;
  sessionId: string;
  studentId: string;
  tutorId: string;
  rating: number; // 1-5
  comment?: string;
  aspects?: {
    communication?: number;
    knowledge?: number;
    helpfulness?: number;
    punctuality?: number;
  };
  improvements?: string[];
  recommend?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ===== PROGRESS TRACKING =====

export interface ProgressEntry {
  id: string;
  studentId: string;
  tutorId: string;
  sessionId?: string;
  subject: string;
  topic: string;
  notes: string;
  score?: number;
  improvements?: string[];
  challenges?: string[];
  nextSteps?: string[];
  createdAt: string;
}

export interface ProgressStats {
  studentId: string;
  subjectStats: {
    subject: string;
    sessionsCompleted: number;
    averageScore?: number;
    totalHours: number;
    improvement?: number; // percentage
  }[];
  totalSessions: number;
  totalHours: number;
  favoriteSubjects: string[];
  recentProgress: ProgressEntry[];
}

// ===== DIGITAL LIBRARY =====

export interface LibraryResource {
  id: string;
  title: string;
  type: 'book' | 'article' | 'video' | 'document' | 'other';
  subject: string;
  description?: string;
  author?: string;
  url?: string;
  fileUrl?: string;
  thumbnail?: string;
  tags: string[];
  sharedBy?: string;
  downloads: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

// ===== FORUM =====

export interface ForumPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  images?: string[]; // URLs or base64 images
  likes: string[]; // user IDs who liked
  views: number;
  pinned: boolean;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentCommentId?: string; // for nested comments
  likes: string[];
  createdAt: string;
  updatedAt: string;
}

// ===== ANALYTICS =====

export interface SessionAnalytics {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  averageDuration: number;
  popularSubjects: { subject: string; count: number }[];
  sessionsPerDay: { date: string; count: number }[];
  sessionsPerTutor: { tutorId: string; count: number }[];
}

export interface TutorPerformance {
  tutorId: string;
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  studentCount: number;
  subjects: string[];
  responseTime?: number; // average in minutes
}

export interface SystemAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalStudents: number;
  totalTutors: number;
  totalSessions: number;
  growthRate: {
    users: number; // percentage
    sessions: number;
  };
  topTutors: TutorPerformance[];
  sessionAnalytics: SessionAnalytics;
}

// ===== APPROVALS =====

export interface ApprovalRequest {
  id: string;
  type: 'tutor_verification' | 'content_moderation' | 'other';
  requesterId: string;
  targetId?: string; // ID of the entity being approved (user, post, etc.)
  title: string;
  description: string;
  status: ApprovalStatus;
  reviewerId?: string;
  reviewNotes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// ===== API RESPONSES =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== SEARCH & FILTERS =====

export interface SearchFilters {
  subject?: string;
  minRating?: number;
  availability?: string; // 'today', 'tomorrow', 'this-week'
  location?: string;
  isOnline?: boolean;
}

export interface TutorMatchScore {
  tutorId: string;
  score: number;
  reasons: string[];
  tutor?: Tutor;
}

// ===== COURSE CONTENT =====

export enum CourseContentType {
  DOCUMENT = 'document',
  ANNOUNCEMENT = 'announcement',
  MATERIAL = 'material',
  LINK = 'link'
}

export interface CourseContent {
  id: string;
  sessionId?: string; // Optional - for one-time sessions
  classId?: string; // Optional - for recurring classes
  type: CourseContentType;
  title: string;
  description?: string;
  content?: string; // For announcements or text content
  fileUrl?: string;
  fileName?: string;
  fileSize?: number; // bytes
  url?: string; // For external links
  createdBy: string; // tutor ID
  createdAt: string;
  updatedAt: string;
}

// ===== QUIZZES =====

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[]; // For multiple choice
  correctAnswer: string | number; // Answer index for MC, string for others
  points: number;
}

export interface Quiz {
  id: string;
  sessionId?: string; // Optional - for one-time sessions
  classId?: string; // Optional - for recurring classes
  title: string;
  description?: string;
  questions: QuizQuestion[];
  totalPoints: number;
  duration?: number; // minutes
  dueDate?: string;
  createdBy: string; // tutor ID
  createdAt: string;
  updatedAt: string;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  answers: {
    questionId: string;
    answer: string | number;
  }[];
  score?: number;
  gradedBy?: string; // tutor ID
  submittedAt: string;
  gradedAt?: string;
}

// ===== ASSIGNMENTS =====

export interface Assignment {
  id: string;
  sessionId?: string; // Optional - for one-time sessions
  classId?: string; // Optional - for recurring classes
  title: string;
  description: string;
  instructions?: string;
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }[];
  totalPoints: number;
  dueDate: string;
  createdBy: string; // tutor ID
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string; // Text submission
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }[];
  score?: number;
  feedback?: string;
  gradedBy?: string; // tutor ID
  submittedAt: string;
  gradedAt?: string;
  status: 'submitted' | 'graded' | 'late';
}

// ===== GRADES =====

export interface Grade {
  id: string;
  sessionId?: string; // Optional - for one-time sessions
  classId?: string; // Optional - for recurring classes
  studentId: string;
  itemType: 'quiz' | 'assignment';
  itemId: string; // quizId or assignmentId
  itemTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  feedback?: string;
  gradedBy: string; // tutor ID
  gradedAt: string;
}

export interface GradeSummary {
  studentId: string;
  sessionId?: string; // Optional - for one-time sessions
  classId?: string; // Optional - for recurring classes
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  grades: Grade[];
}

// ===== SESSION REQUESTS =====

export interface SessionRequest {
  id: string;
  sessionId: string;
  studentId: string;
  tutorId: string;
  classId?: string; // Optional - copy from session.classId to distinguish class session vs individual
  type: RequestType; // cancel or reschedule
  status: RequestStatus;
  reason: string; // reason from student
  preferredStartTime?: string; // for reschedule
  preferredEndTime?: string; // for reschedule
  alternativeSessionId?: string; // For class reschedule - selected alternative session ID
  responseMessage?: string; // response from tutor
  createdAt: string;
  updatedAt: string;
}

