import { z } from 'zod';
import { UserRole, SessionStatus, NotificationType, CourseContentType } from './types.js';

// ===== AUTH SCHEMAS =====

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  // Role-specific fields
  major: z.string().optional(),
  year: z.number().min(1).max(6).optional(),
  subjects: z.array(z.string()).optional(),
  bio: z.string().optional()
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  // Student fields
  major: z.string().optional(),
  year: z.number().min(1).max(6).optional(),
  interests: z.array(z.string()).optional(),
  preferredSubjects: z.array(z.string()).optional(),
  // Tutor fields
  subjects: z.array(z.string()).optional(),
  bio: z.string().optional(),
  credentials: z.array(z.string()).optional()
});

// ===== SESSION SCHEMAS =====

export const createSessionSchema = z.object({
  tutorId: z.string().optional(), // Optional if classId is provided
  classId: z.string().optional(), // For class-based sessions
  subject: z.string().min(1, 'Subject is required').optional(), // Optional if classId is provided
  topic: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().datetime('Invalid datetime format'),
  endTime: z.string().datetime('Invalid datetime format'),
  duration: z.number().positive(),
  isOnline: z.boolean().default(true),
  meetingLink: z.string().url().optional(),
  location: z.string().optional(),
  notes: z.string().optional()
});

export const updateSessionSchema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(SessionStatus).optional(),
  notes: z.string().optional(),
  meetingLink: z.string().url().optional()
});

export const rescheduleSessionSchema = z.object({
  startTime: z.string().datetime('Invalid datetime format'),
  endTime: z.string().datetime('Invalid datetime format'),
  reason: z.string().optional()
});

export const cancelSessionSchema = z.object({
  reason: z.string().min(10, 'Please provide a reason (min 10 characters)')
});

// ===== SESSION REQUEST SCHEMAS =====

export const createSessionRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  type: z.enum(['cancel', 'reschedule'], {
    required_error: 'Request type is required',
    invalid_type_error: 'Request type must be either cancel or reschedule'
  }),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  preferredStartTime: z.string().datetime('Invalid preferred start time format').optional(),
  preferredEndTime: z.string().datetime('Invalid preferred end time format').optional(),
  alternativeSessionId: z.string().optional() // For class reschedule - selected alternative class/session ID
}).refine(
  (data) => {
    if (data.type === 'reschedule') {
      // If alternativeSessionId is provided (class reschedule), preferredStartTime/EndTime are not required
      if (data.alternativeSessionId) {
        return true;
      }
      // Otherwise, preferredStartTime and preferredEndTime are required
      return !!data.preferredStartTime && !!data.preferredEndTime;
    }
    return true;
  },
  {
    message: 'Preferred start time and end time are required for reschedule requests (unless alternative session/class is selected)',
    path: ['preferredStartTime']
  }
);

export const approveSessionRequestSchema = z.object({
  responseMessage: z.string().optional(),
  newStartTime: z.string().datetime('Invalid new start time format').optional(),
  newEndTime: z.string().datetime('Invalid new end time format').optional()
});

export const rejectSessionRequestSchema = z.object({
  responseMessage: z.string().optional()
});

// ===== AVAILABILITY SCHEMAS =====

export const timeSlotSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
});

export const setAvailabilitySchema = z.object({
  timeSlots: z.array(timeSlotSchema).min(1, 'At least one time slot is required'),
  exceptions: z.array(
    z.object({
      date: z.string().date(),
      reason: z.string()
    })
  ).optional()
});

// ===== CLASS SCHEMAS =====

export const createClassSchema = z.object({
  code: z.string().min(1, 'Class code is required').optional(), // Auto-generated if not provided
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  duration: z.number().positive('Duration must be positive'),
  maxStudents: z.number().positive('Max students must be positive'),
  semesterStart: z.string().datetime('Invalid semester start date'),
  semesterEnd: z.string().datetime('Invalid semester end date'),
  isOnline: z.boolean().default(true),
  location: z.string().optional()
});

export const updateClassSchema = z.object({
  code: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  description: z.string().optional(),
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  duration: z.number().positive().optional(),
  maxStudents: z.number().positive().optional(),
  semesterStart: z.string().datetime().optional(),
  semesterEnd: z.string().datetime().optional(),
  isOnline: z.boolean().optional(),
  location: z.string().optional(),
  status: z.enum(['active', 'inactive', 'full']).optional()
});

// ===== ENROLLMENT SCHEMAS =====

export const createEnrollmentSchema = z.object({
  classId: z.string().min(1, 'Class ID is required')
});

export const updateEnrollmentSchema = z.object({
  status: z.enum(['active', 'completed', 'dropped', 'cancelled']),
  notes: z.string().optional()
});

// ===== EVALUATION SCHEMAS =====

export const createEvaluationSchema = z.object({
  sessionId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  aspects: z.object({
    communication: z.number().min(1).max(5),
    knowledge: z.number().min(1).max(5),
    helpfulness: z.number().min(1).max(5),
    punctuality: z.number().min(1).max(5)
  }).optional()
});

// ===== PROGRESS SCHEMAS =====

export const createProgressSchema = z.object({
  sessionId: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().min(1, 'Topic is required'),
  notes: z.string().min(10, 'Notes must be at least 10 characters'),
  score: z.number().min(0).max(10).optional(),
  improvements: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()).optional()
});

// ===== MESSAGE SCHEMAS =====

export const sendMessageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1, 'Message cannot be empty'),
  type: z.enum(['text', 'file', 'image']).default('text'),
  fileUrl: z.string().url().optional()
});

// ===== NOTIFICATION SCHEMAS =====

export const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  link: z.string().optional(),
  metadata: z.any().optional()
});

// ===== LIBRARY SCHEMAS =====

export const createLibraryResourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['book', 'article', 'video', 'document', 'other']),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  author: z.string().optional(),
  url: z.string().url().optional(),
  fileUrl: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  tags: z.array(z.string()).default([])
});

export const shareResourceSchema = z.object({
  resourceId: z.string(),
  userIds: z.array(z.string()).min(1, 'At least one user must be specified')
});

// ===== FORUM SCHEMAS =====

export const createForumPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).optional()
});

export const updateForumPostSchema = z.object({
  title: z.string().min(5).optional(),
  content: z.string().min(20).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  parentCommentId: z.string().optional()
});

// ===== APPROVAL SCHEMAS =====

export const createApprovalRequestSchema = z.object({
  type: z.enum(['tutor_verification', 'content_moderation', 'other']),
  targetId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  attachments: z.array(z.string()).optional()
});

export const reviewApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().optional()
});

// ===== SEARCH & FILTER SCHEMAS =====

export const searchTutorsSchema = z.object({
  subject: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  availability: z.enum(['today', 'tomorrow', 'this-week', 'next-week']).optional(),
  location: z.string().optional(),
  isOnline: z.boolean().optional(),
  useAI: z.boolean().default(false),
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(10)
});

export const searchLibrarySchema = z.object({
  query: z.string().optional(),
  subject: z.string().optional(),
  type: z.enum(['book', 'article', 'video', 'document', 'other']).optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(10)
});

// ===== ANALYTICS SCHEMAS =====

export const analyticsDateRangeSchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day')
});

// ===== COURSE CONTENT SCHEMAS =====

export const createCourseContentSchema = z.object({
  sessionId: z.string(),
  type: z.nativeEnum(CourseContentType),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().optional(), // For announcements
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().positive().optional(),
  url: z.string().url().optional() // For external links
});

export const updateCourseContentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().positive().optional(),
  url: z.string().url().optional()
});

// ===== QUIZ SCHEMAS =====

export const quizQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1, 'Question is required'),
  type: z.enum(['multiple_choice', 'true_false', 'short_answer']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number()]),
  points: z.number().positive()
});

export const createQuizSchema = z.object({
  sessionId: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  questions: z.array(quizQuestionSchema).min(1, 'At least one question is required'),
  duration: z.number().positive().optional(),
  dueDate: z.string().datetime().optional()
});

export const updateQuizSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  questions: z.array(quizQuestionSchema).optional(),
  duration: z.number().positive().optional(),
  dueDate: z.string().datetime().optional()
});

export const submitQuizSchema = z.object({
  quizId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.union([z.string(), z.number()])
  }))
});

// ===== ASSIGNMENT SCHEMAS =====

export const createAssignmentSchema = z.object({
  sessionId: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  instructions: z.string().optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string().url(),
    fileSize: z.number().positive()
  })).optional(),
  totalPoints: z.number().positive(),
  dueDate: z.string().datetime('Invalid due date format')
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  instructions: z.string().optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string().url(),
    fileSize: z.number().positive()
  })).optional(),
  totalPoints: z.number().positive().optional(),
  dueDate: z.string().datetime().optional()
});

export const submitAssignmentSchema = z.object({
  assignmentId: z.string(),
  content: z.string().optional(),
  attachments: z.array(z.object({
    fileName: z.string(),
    fileUrl: z.string().url(),
    fileSize: z.number().positive()
  })).optional()
});

// ===== GRADING SCHEMAS =====

export const gradeSubmissionSchema = z.object({
  submissionId: z.string(),
  score: z.number().min(0),
  feedback: z.string().optional()
});

// ===== SESSION STUDENTS SCHEMAS =====

export const addStudentToSessionSchema = z.object({
  studentId: z.string()
});

// ===== TYPE EXPORTS =====

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type RescheduleSessionInput = z.infer<typeof rescheduleSessionSchema>;
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type CreateProgressInput = z.infer<typeof createProgressSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateLibraryResourceInput = z.infer<typeof createLibraryResourceSchema>;
export type CreateForumPostInput = z.infer<typeof createForumPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type SearchTutorsInput = z.infer<typeof searchTutorsSchema>;
export type CreateCourseContentInput = z.infer<typeof createCourseContentSchema>;
export type UpdateCourseContentInput = z.infer<typeof updateCourseContentSchema>;
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type CreateSessionRequestInput = z.infer<typeof createSessionRequestSchema>;
export type ApproveSessionRequestInput = z.infer<typeof approveSessionRequestSchema>;
export type RejectSessionRequestInput = z.infer<typeof rejectSessionRequestSchema>;

