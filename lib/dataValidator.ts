/**
 * Data Validation Utilities
 * Team B - Ngày 1-2
 * 
 * Validates data integrity across all JSON files
 */

import { storage } from './storage.js';
import {
  User,
  Session,
  Evaluation,
  ProgressEntry,
  LibraryResource,
  ForumPost,
  ForumComment,
  Notification,
  Availability,
  ApprovalRequest,
  Conversation,
  Message,
  UserRole,
  SessionStatus
} from './types.js';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    [key: string]: number;
  };
}

/**
 * Validate all database files
 */
export async function validateAllData(): Promise<ValidationResult> {
  console.log('🔍 Starting data validation...\n');
  
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: { [key: string]: number } = {};

  try {
    // Validate Users
    const usersResult = await validateUsers();
    errors.push(...usersResult.errors);
    warnings.push(...usersResult.warnings);
    stats.users = usersResult.count;

    // Validate Sessions
    const sessionsResult = await validateSessions();
    errors.push(...sessionsResult.errors);
    warnings.push(...sessionsResult.warnings);
    stats.sessions = sessionsResult.count;

    // Validate Evaluations
    const evaluationsResult = await validateEvaluations();
    errors.push(...evaluationsResult.errors);
    warnings.push(...evaluationsResult.warnings);
    stats.evaluations = evaluationsResult.count;

    // Validate Progress
    const progressResult = await validateProgress();
    errors.push(...progressResult.errors);
    warnings.push(...progressResult.warnings);
    stats.progress = progressResult.count;

    // Validate Library
    const libraryResult = await validateLibrary();
    errors.push(...libraryResult.errors);
    warnings.push(...libraryResult.warnings);
    stats.library = libraryResult.count;

    // Validate Forum
    const forumResult = await validateForum();
    errors.push(...forumResult.errors);
    warnings.push(...forumResult.warnings);
    stats.forumPosts = forumResult.postsCount;
    stats.forumComments = forumResult.commentsCount;

    // Validate Notifications
    const notificationsResult = await validateNotifications();
    errors.push(...notificationsResult.errors);
    warnings.push(...notificationsResult.warnings);
    stats.notifications = notificationsResult.count;

    // Validate Availability
    const availabilityResult = await validateAvailability();
    errors.push(...availabilityResult.errors);
    warnings.push(...availabilityResult.warnings);
    stats.availability = availabilityResult.count;

    // Validate Approvals
    const approvalsResult = await validateApprovals();
    errors.push(...approvalsResult.errors);
    warnings.push(...approvalsResult.warnings);
    stats.approvals = approvalsResult.count;

    const valid = errors.length === 0;

    console.log('\n📊 Validation Results:');
    console.log(`Status: ${valid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log('\nStats:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    return { valid, errors, warnings, stats };
  } catch (error: any) {
    errors.push(`Critical validation error: ${error.message}`);
    return { valid: false, errors, warnings, stats };
  }
}

/**
 * Validate Users data
 */
async function validateUsers() {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const users = await storage.read<User>('users.json');
  
  // Check for duplicate IDs
  const ids = new Set<string>();
  const emails = new Set<string>();
  
  users.forEach((user, index) => {
    // Check required fields
    if (!user.id) errors.push(`User at index ${index} missing ID`);
    if (!user.email) errors.push(`User at index ${index} missing email`);
    if (!user.name) errors.push(`User at index ${index} missing name`);
    if (!user.role) errors.push(`User at index ${index} missing role`);
    
    // Check duplicates
    if (user.id && ids.has(user.id)) {
      errors.push(`Duplicate user ID: ${user.id}`);
    }
    ids.add(user.id);
    
    if (user.email && emails.has(user.email)) {
      errors.push(`Duplicate email: ${user.email}`);
    }
    emails.add(user.email);
    
    // Check email format
    if (user.email && !user.email.endsWith('@hcmut.edu.vn')) {
      warnings.push(`User ${user.id} has non-HCMUT email: ${user.email}`);
    }
    
    // Role-specific validation
    if (user.role === UserRole.TUTOR) {
      const tutor = user as any;
      if (!tutor.subjects || tutor.subjects.length === 0) {
        warnings.push(`Tutor ${user.id} has no subjects`);
      }
      if (tutor.rating === undefined) {
        warnings.push(`Tutor ${user.id} has no rating`);
      }
    }
  });
  
  console.log(`✅ Users: ${users.length} records`);
  
  return { errors, warnings, count: users.length };
}

/**
 * Validate Sessions data
 */
async function validateSessions() {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const sessions = await storage.read<Session>('sessions.json');
  const users = await storage.read<User>('users.json');
  const userIds = new Set(users.map(u => u.id));
  
  sessions.forEach((session, index) => {
    // Check required fields
    if (!session.id) errors.push(`Session at index ${index} missing ID`);
    if (!session.studentId) errors.push(`Session at index ${index} missing studentId`);
    if (!session.tutorId) errors.push(`Session at index ${index} missing tutorId`);
    if (!session.subject) errors.push(`Session at index ${index} missing subject`);
    
    // Check foreign keys
    if (session.studentId && !userIds.has(session.studentId)) {
      errors.push(`Session ${session.id} references non-existent student: ${session.studentId}`);
    }
    if (session.tutorId && !userIds.has(session.tutorId)) {
      errors.push(`Session ${session.id} references non-existent tutor: ${session.tutorId}`);
    }
    
    // Check dates
    if (session.startTime && session.endTime) {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      if (end <= start) {
        errors.push(`Session ${session.id} has invalid time range`);
      }
    }
    
    // Check duration
    if (session.duration && session.duration < 30) {
      warnings.push(`Session ${session.id} has very short duration: ${session.duration}min`);
    }
  });
  
  console.log(`✅ Sessions: ${sessions.length} records`);
  
  return { errors, warnings, count: sessions.length };
}

/**
 * Validate Evaluations data
 */
async function validateEvaluations() {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const evaluations = await storage.read<Evaluation>('evaluations.json');
  const sessions = await storage.read<Session>('sessions.json');
  const sessionIds = new Set(sessions.map(s => s.id));
  
  evaluations.forEach((evaluation, index) => {
    // Check required fields
    if (!evaluation.id) errors.push(`Evaluation at index ${index} missing ID`);
    if (!evaluation.sessionId) errors.push(`Evaluation at index ${index} missing sessionId`);
    if (!evaluation.rating) errors.push(`Evaluation at index ${index} missing rating`);
    
    // Check foreign keys
    if (evaluation.sessionId && !sessionIds.has(evaluation.sessionId)) {
      errors.push(`Evaluation ${evaluation.id} references non-existent session: ${evaluation.sessionId}`);
    }
    
    // Check rating range
    if (evaluation.rating && (evaluation.rating < 1 || evaluation.rating > 5)) {
      errors.push(`Evaluation ${evaluation.id} has invalid rating: ${evaluation.rating}`);
    }
    
    // Check aspects
    if (evaluation.aspects) {
      const aspects = evaluation.aspects;
      Object.entries(aspects).forEach(([key, value]) => {
        if (value < 1 || value > 5) {
          errors.push(`Evaluation ${evaluation.id} has invalid ${key} score: ${value}`);
        }
      });
    }
  });
  
  console.log(`✅ Evaluations: ${evaluations.length} records`);
  
  return { errors, warnings, count: evaluations.length };
}

/**
 * Validate Progress data
 */
async function validateProgress() {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const progress = await storage.read<ProgressEntry>('progress.json');
  const users = await storage.read<User>('users.json');
  const userIds = new Set(users.map(u => u.id));
  
  progress.forEach((entry, index) => {
    // Check required fields
    if (!entry.id) errors.push(`Progress entry at index ${index} missing ID`);
    if (!entry.studentId) errors.push(`Progress entry at index ${index} missing studentId`);
    if (!entry.subject) errors.push(`Progress entry at index ${index} missing subject`);
    
    // Check foreign keys
    if (entry.studentId && !userIds.has(entry.studentId)) {
      errors.push(`Progress ${entry.id} references non-existent student: ${entry.studentId}`);
    }
    if (entry.tutorId && !userIds.has(entry.tutorId)) {
      errors.push(`Progress ${entry.id} references non-existent tutor: ${entry.tutorId}`);
    }
    
    // Check score
    if (entry.score !== undefined && (entry.score < 0 || entry.score > 10)) {
      errors.push(`Progress ${entry.id} has invalid score: ${entry.score}`);
    }
  });
  
  console.log(`✅ Progress: ${progress.length} records`);
  
  return { errors, warnings, count: progress.length };
}

/**
 * Validate Library data
 */
async function validateLibrary() {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const library = await storage.read<LibraryResource>('library.json');
  
  library.forEach((resource, index) => {
    // Check required fields
    if (!resource.id) errors.push(`Library resource at index ${index} missing ID`);
    if (!resource.title) errors.push(`Library resource at index ${index} missing title`);
    if (!resource.type) errors.push(`Library resource at index ${index} missing type`);
    if (!resource.subject) errors.push(`Library resource at index ${index} missing subject`);
    
    // Check type
    const validTypes = ['book', 'article', 'video', 'document', 'other'];
    if (resource.type && !validTypes.includes(resource.type)) {
      errors.push(`Library resource ${resource.id} has invalid type: ${resource.type}`);
    }
  });
  
  console.log(`✅ Library: ${library.length} records`);
  
  return { errors, warnings, count: library.length };
}

/**
 * Validate Forum data
 */
async function validateForum() {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const posts = await storage.read<ForumPost>('forum-posts.json');
  const comments = await storage.read<ForumComment>('forum-comments.json');
  const users = await storage.read<User>('users.json');
  
  const userIds = new Set(users.map(u => u.id));
  const postIds = new Set(posts.map(p => p.id));
  
  // Validate posts
  posts.forEach((post, index) => {
    if (!post.id) errors.push(`Forum post at index ${index} missing ID`);
    if (!post.authorId) errors.push(`Forum post at index ${index} missing authorId`);
    if (!post.title) errors.push(`Forum post at index ${index} missing title`);
    if (!post.content) errors.push(`Forum post at index ${index} missing content`);
    
    if (post.authorId && !userIds.has(post.authorId)) {
      errors.push(`Post ${post.id} references non-existent author: ${post.authorId}`);
    }
  });
  
  // Validate comments
  comments.forEach((comment, index) => {
    if (!comment.id) errors.push(`Forum comment at index ${index} missing ID`);
    if (!comment.postId) errors.push(`Forum comment at index ${index} missing postId`);
    if (!comment.authorId) errors.push(`Forum comment at index ${index} missing authorId`);
    if (!comment.content) errors.push(`Forum comment at index ${index} missing content`);
    
    if (comment.postId && !postIds.has(comment.postId)) {
      errors.push(`Comment ${comment.id} references non-existent post: ${comment.postId}`);
    }
    if (comment.authorId && !userIds.has(comment.authorId)) {
      errors.push(`Comment ${comment.id} references non-existent author: ${comment.authorId}`);
    }
  });
  
  console.log(`✅ Forum: ${posts.length} posts, ${comments.length} comments`);
  
  return { errors, warnings, postsCount: posts.length, commentsCount: comments.length };
}

/**
 * Validate Notifications data
 */
async function validateNotifications() {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const notifications = await storage.read<Notification>('notifications.json');
  const users = await storage.read<User>('users.json');
  const userIds = new Set(users.map(u => u.id));
  
  notifications.forEach((notification, index) => {
    if (!notification.id) errors.push(`Notification at index ${index} missing ID`);
    if (!notification.userId) errors.push(`Notification at index ${index} missing userId`);
    if (!notification.title) errors.push(`Notification at index ${index} missing title`);
    
    if (notification.userId && !userIds.has(notification.userId)) {
      errors.push(`Notification ${notification.id} references non-existent user: ${notification.userId}`);
    }
  });
  
  console.log(`✅ Notifications: ${notifications.length} records`);
  
  return { errors, warnings, count: notifications.length };
}

/**
 * Validate Availability data
 */
async function validateAvailability() {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const availability = await storage.read<Availability>('availability.json');
  const users = await storage.read<User>('users.json');
  const tutorIds = new Set(users.filter(u => u.role === UserRole.TUTOR).map(u => u.id));
  
  availability.forEach((avail, index) => {
    if (!avail.id) errors.push(`Availability at index ${index} missing ID`);
    if (!avail.tutorId) errors.push(`Availability at index ${index} missing tutorId`);
    
    if (avail.tutorId && !tutorIds.has(avail.tutorId)) {
      errors.push(`Availability ${avail.id} references non-tutor: ${avail.tutorId}`);
    }
    
    if (!avail.timeSlots || avail.timeSlots.length === 0) {
      warnings.push(`Availability ${avail.id} has no time slots`);
    }
  });
  
  console.log(`✅ Availability: ${availability.length} records`);
  
  return { errors, warnings, count: availability.length };
}

/**
 * Validate Approvals data
 */
async function validateApprovals() {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const approvals = await storage.read<ApprovalRequest>('approvals.json');
  const users = await storage.read<User>('users.json');
  const userIds = new Set(users.map(u => u.id));
  
  approvals.forEach((approval, index) => {
    if (!approval.id) errors.push(`Approval at index ${index} missing ID`);
    if (!approval.requesterId) errors.push(`Approval at index ${index} missing requesterId`);
    
    if (approval.requesterId && !userIds.has(approval.requesterId)) {
      errors.push(`Approval ${approval.id} references non-existent requester: ${approval.requesterId}`);
    }
  });
  
  console.log(`✅ Approvals: ${approvals.length} records`);
  
  return { errors, warnings, count: approvals.length };
}

/**
 * Generate data statistics report
 */
export async function generateDataStats() {
  console.log('📊 Generating data statistics...\n');
  
  const users = await storage.read<User>('users.json');
  const sessions = await storage.read<Session>('sessions.json');
  const evaluations = await storage.read<Evaluation>('evaluations.json');
  const progress = await storage.read<ProgressEntry>('progress.json');
  const library = await storage.read<LibraryResource>('library.json');
  const forumPosts = await storage.read<ForumPost>('forum-posts.json');
  const forumComments = await storage.read<ForumComment>('forum-comments.json');
  const notifications = await storage.read<Notification>('notifications.json');
  const availability = await storage.read<Availability>('availability.json');
  const approvals = await storage.read<ApprovalRequest>('approvals.json');
  
  const stats = {
    users: {
      total: users.length,
      students: users.filter(u => u.role === UserRole.STUDENT).length,
      tutors: users.filter(u => u.role === UserRole.TUTOR).length,
      management: users.filter(u => u.role === UserRole.MANAGEMENT).length
    },
    sessions: {
      total: sessions.length,
      pending: sessions.filter(s => s.status === SessionStatus.PENDING).length,
      confirmed: sessions.filter(s => s.status === SessionStatus.CONFIRMED).length,
      completed: sessions.filter(s => s.status === SessionStatus.COMPLETED).length,
      cancelled: sessions.filter(s => s.status === SessionStatus.CANCELLED).length
    },
    evaluations: {
      total: evaluations.length,
      averageRating: evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length || 0
    },
    progress: {
      total: progress.length
    },
    library: {
      total: library.length,
      byType: {
        book: library.filter(l => l.type === 'book').length,
        article: library.filter(l => l.type === 'article').length,
        video: library.filter(l => l.type === 'video').length,
        document: library.filter(l => l.type === 'document').length
      }
    },
    forum: {
      posts: forumPosts.length,
      comments: forumComments.length,
      totalLikes: forumPosts.reduce((sum, p) => sum + (p.likes?.length || 0), 0)
    },
    notifications: {
      total: notifications.length,
      read: notifications.filter(n => n.read).length,
      unread: notifications.filter(n => !n.read).length
    },
    availability: {
      total: availability.length
    },
    approvals: {
      total: approvals.length
    }
  };
  
  console.log(JSON.stringify(stats, null, 2));
  
  return stats;
}

export default {
  validateAllData,
  generateDataStats
};

