/**
 * Sessions APIs
 * GET /api/sessions - List sessions
 * POST /api/sessions - Book new session
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { Session, SessionStatus, UserRole, Notification, NotificationType, Class, ClassStatus, Enrollment } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../lib/utils.js';

/**
 * GET /api/sessions
 */
export async function listSessionsHandler(req: AuthRequest, res: Response) {
  try {
    const {
      studentId,
      tutorId,
      status,
      startDate,
      endDate,
      classId,
      page = '1',
      limit = '10'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const currentUser = req.user!;

    // Build filter
    const filter = (session: Session) => {
      // Authorization: users can only see their own sessions unless management
      if (currentUser.role !== UserRole.MANAGEMENT) {
        if (
          !session.studentIds?.includes(currentUser.userId) &&
          session.tutorId !== currentUser.userId
        ) {
          return false;
        }
      }

      // Filter by studentId
      if (studentId && !session.studentIds?.includes(studentId as string)) return false;

      // Filter by tutorId
      if (tutorId && session.tutorId !== tutorId) return false;

      // Filter by classId
      if (classId) {
        if (classId === 'null' || classId === 'undefined') {
          // Filter for individual sessions (no classId)
          if (session.classId) return false;
        } else {
          // Filter for specific class sessions
          if (session.classId !== classId) return false;
        }
      }

      // Filter by status
      if (status && session.status !== status) return false;

      // Filter by date range
      if (startDate) {
        if (new Date(session.startTime) < new Date(startDate as string)) {
          return false;
        }
      }
      if (endDate) {
        if (new Date(session.startTime) > new Date(endDate as string)) {
          return false;
        }
      }

      return true;
    };

    const result = await storage.paginate<Session>(
      'sessions.json',
      pageNum,
      limitNum,
      filter
    );

    return res.json(result);
  } catch (error: any) {
    console.error('List sessions error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách buổi học: ' + error.message)
    );
  }
}

/**
 * POST /api/sessions
 */
/**
 * Helper function to check time conflict between two time ranges
 */
function hasTimeConflict(
  day1: string,
  start1: string,
  end1: string,
  day2: string,
  start2: string,
  end2: string
): boolean {
  // Different days = no conflict
  if (day1 !== day2) return false;

  // Convert time strings to minutes for comparison
  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = parseTime(start1);
  const end1Min = parseTime(end1);
  const start2Min = parseTime(start2);
  const end2Min = parseTime(end2);

  // Check time overlap
  return (
    (start1Min >= start2Min && start1Min < end2Min) ||
    (end1Min > start2Min && end1Min <= end2Min) ||
    (start1Min <= start2Min && end1Min >= end2Min)
  );
}

export async function createSessionHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const sessionData = req.body;

    let studentIds: string[] = [];
    let tutorId: string = sessionData.tutorId;
    let subject: string = sessionData.subject;
    let isClassBased = false;

    // Check if this is a class-based session
    if (sessionData.classId) {
      // Class-based session creation (tutors only)
      if (currentUser.role !== UserRole.TUTOR) {
        return res.status(403).json(
          errorResponse('Chỉ gia sư mới có thể tạo buổi học từ lớp')
        );
      }

      // Get class details
      const classItem = await storage.findById<Class>('classes.json', sessionData.classId);
      if (!classItem) {
        return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
      }

      // Verify tutor owns this class
      if (classItem.tutorId !== currentUser.userId) {
        return res.status(403).json(
          errorResponse('Bạn không có quyền tạo buổi học cho lớp này')
        );
      }

      // Get all enrolled students
      const enrollments = await storage.find<Enrollment>(
        'enrollments.json',
        (e) => e.classId === sessionData.classId && e.status === 'active'
      );

      studentIds = enrollments.map(e => e.studentId);
      tutorId = classItem.tutorId;
      subject = classItem.subject;
      isClassBased = true;
    } else {
      // Manual session booking (students only)
      if (currentUser.role !== UserRole.STUDENT) {
        return res.status(403).json(
          errorResponse('Chỉ sinh viên mới có thể đặt buổi học')
        );
      }

      // Verify tutor exists
      const tutor = await storage.findById('users.json', sessionData.tutorId);
      if (!tutor || tutor.role !== UserRole.TUTOR) {
        return res.status(404).json(
          errorResponse('Không tìm thấy gia sư')
        );
      }

      studentIds = [currentUser.userId];

      // Check for conflicts with tutor's class schedules
      // Only check if this is NOT a class-based session (manual booking)
      const tutorClasses = await storage.find<Class>(
        'classes.json',
        (c) => c.tutorId === tutorId && c.status !== ClassStatus.INACTIVE
      );

      // Get day name from session start time
      const sessionDate = new Date(sessionData.startTime);
      const sessionDay = sessionDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const sessionStartTime = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const sessionEndTime = new Date(new Date(sessionData.startTime).getTime() + (sessionData.duration || 60) * 60000)
        .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

      // Check for conflicts with classes on the same day
      for (const classItem of tutorClasses) {
        if (hasTimeConflict(
          sessionDay,
          sessionStartTime,
          sessionEndTime,
          classItem.day.toLowerCase(),
          classItem.startTime,
          classItem.endTime
        )) {
          return res.status(400).json(
            errorResponse(`Thời gian buổi học trùng với lớp ${classItem.code} (${classItem.day} ${classItem.startTime}-${classItem.endTime}). Vui lòng chọn thời gian khác.`)
          );
        }
      }

      // Also check for conflicts with existing sessions at the exact same date and time
      const existingSessions = await storage.find<Session>(
        'sessions.json',
        (s) => s.tutorId === tutorId && !s.classId // Only check non-class-based sessions
      );

      const newSessionStart = new Date(sessionData.startTime);
      const newSessionEnd = new Date(newSessionStart.getTime() + (sessionData.duration || 60) * 60000);

      for (const existingSession of existingSessions) {
        const existingStart = new Date(existingSession.startTime);
        const existingEnd = new Date(existingStart.getTime() + (existingSession.duration || 60) * 60000);

        // Check if sessions overlap (same exact date and overlapping times)
        if (
          (newSessionStart >= existingStart && newSessionStart < existingEnd) ||
          (newSessionEnd > existingStart && newSessionEnd <= existingEnd) ||
          (newSessionStart <= existingStart && newSessionEnd >= existingEnd)
        ) {
          return res.status(400).json(
            errorResponse('Thời gian buổi học đã được đặt bởi buổi học khác. Vui lòng chọn thời gian khác.')
          );
        }
      }
    }

    // Create new session
    const newSession: Session = {
      id: generateId('ses'),
      studentIds: studentIds,
      tutorId: tutorId,
      subject: subject,
      topic: sessionData.topic,
      description: sessionData.description,
      status: isClassBased ? SessionStatus.CONFIRMED : SessionStatus.PENDING,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      duration: sessionData.duration,
      isOnline: sessionData.isOnline ?? true,
      meetingLink: sessionData.meetingLink,
      location: sessionData.location,
      notes: sessionData.notes || '',
      classId: sessionData.classId,
      createdAt: now(),
      updatedAt: now()
    };

    await storage.create('sessions.json', newSession);

    // Create notification - batch create for class-based sessions
    if (isClassBased) {
      // Notify all enrolled students - batch create
      if (studentIds.length > 0) {
        const notifications: Notification[] = studentIds.map(studentId => ({
          id: generateId('notif'),
          userId: studentId,
          type: NotificationType.SESSION_BOOKING,
          title: 'Buổi học mới được tạo',
          message: `Buổi học mới cho môn ${subject}`,
          read: false,
          link: `/sessions/${newSession.id}`,
          createdAt: now()
        }));
        await storage.createMany('notifications.json', notifications);
      }
    } else {
      // Notify tutor (single notification, no need for batch)
      const notification: Notification = {
        id: generateId('notif'),
        userId: tutorId,
        type: NotificationType.SESSION_BOOKING,
        title: 'Yêu cầu buổi học mới',
        message: `${currentUser.email} đã đặt buổi học ${subject}`,
        read: false,
        link: `/sessions/${newSession.id}`,
        createdAt: now()
      };
      await storage.create('notifications.json', notification);
    }

    return res.status(201).json(
      successResponse(newSession, 'Đặt buổi học thành công')
    );
  } catch (error: any) {
    console.error('Create session error:', error);
    return res.status(500).json(
      errorResponse('Lỗi tạo buổi học: ' + error.message)
    );
  }
}

