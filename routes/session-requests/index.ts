/**
 * Session Requests APIs
 * GET /api/session-requests - List session requests
 * POST /api/session-requests - Create new session request
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { 
  SessionRequest, 
  Session, 
  User, 
  Class,
  Notification, 
  NotificationType,
  UserRole,
  SessionStatus,
  RequestType,
  RequestStatus,
  Availability,
  ClassStatus
} from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../lib/utils.js';

/**
 * GET /api/session-requests
 */
export async function listSessionRequestsHandler(req: AuthRequest, res: Response) {
  try {
    const {
      status,
      type,
      tutorId,
      studentId,
      classId,
      page = '1',
      limit = '10'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const currentUser = req.user!;

    // Build filter
    const filter = (request: SessionRequest) => {
      // Authorization:
      // - Tutors can see requests for their sessions
      // - Students can see their own requests
      // - Management can see all
      if (currentUser.role === UserRole.TUTOR) {
        if (request.tutorId !== currentUser.userId) return false;
      } else if (currentUser.role === UserRole.STUDENT) {
        if (request.studentId !== currentUser.userId) return false;
      }
      // Management can see all (no filter needed)

      if (status && request.status !== status) return false;
      if (type && request.type !== type) return false;
      if (tutorId && request.tutorId !== tutorId) return false;
      if (studentId && request.studentId !== studentId) return false;
      if (classId && request.classId !== classId) return false;

      return true;
    };

    const result = await storage.paginate<SessionRequest>(
      'session-requests.json',
      pageNum,
      limitNum,
      filter
    );

    // Batch load all related data to avoid multiple findById calls
    // Collect all unique IDs
    const sessionIds = new Set<string>();
    const userIds = new Set<string>();
    const classIds = new Set<string>();
    
    result.data.forEach(request => {
      if (request.sessionId) sessionIds.add(request.sessionId);
      if (request.studentId) userIds.add(request.studentId);
      if (request.tutorId) userIds.add(request.tutorId);
      if (request.classId) classIds.add(request.classId);
    });

    // Load all data in parallel (only 3 read operations instead of N*3)
    const [sessionsMap, usersMap, classesMap] = await Promise.all([
      storage.findByIds<Session>('sessions.json', Array.from(sessionIds)),
      storage.findByIds<User>('users.json', Array.from(userIds)),
      storage.findByIds<Class>('classes.json', Array.from(classIds))
    ]);

    // Enrich with session, student, tutor, and class info (no more async calls)
    const enrichedData = result.data.map((request) => {
      const session = sessionsMap.get(request.sessionId);
      const student = usersMap.get(request.studentId);
      const tutor = usersMap.get(request.tutorId);
      let classInfo = null;
      
      if (request.classId) {
        const classItem = classesMap.get(request.classId);
        if (classItem) {
          classInfo = {
            id: classItem.id,
            code: classItem.code,
            subject: classItem.subject,
            day: classItem.day,
            startTime: classItem.startTime,
            endTime: classItem.endTime
          };
        }
      }

      return {
        ...request,
        session: session ? {
          id: session.id,
          subject: session.subject,
          topic: session.topic,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          isOnline: session.isOnline,
          location: session.location,
          meetingLink: session.meetingLink
        } : null,
        student: student ? {
          id: student.id,
          name: student.name,
          email: student.email,
          avatar: student.avatar,
          hcmutId: student.hcmutId
        } : null,
        tutor: tutor ? {
          id: tutor.id,
          name: tutor.name,
          email: tutor.email,
          avatar: tutor.avatar
        } : null,
        class: classInfo
      };
    });

    return res.json({
      success: true,
      data: enrichedData,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('List session requests error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách yêu cầu: ' + error.message)
    );
  }
}

/**
 * Helper function to validate reschedule preferred time
 * Checks:
 * 1. If preferred time is within tutor's availability
 * 2. If preferred time conflicts with existing sessions (excluding current session)
 * 3. If preferred time conflicts with tutor's classes
 */
async function validateRescheduleTime(
  tutorId: string,
  preferredStartTime: string,
  preferredEndTime: string,
  excludeSessionId?: string
): Promise<string | null> {
  const preferredStart = new Date(preferredStartTime);
  const preferredEnd = new Date(preferredEndTime);
  const preferredDay = preferredStart.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const preferredStartTimeStr = preferredStart.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  const preferredEndTimeStr = preferredEnd.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });

  // 1. Check if preferred time is within tutor's availability
  const availabilities = await storage.find<Availability>(
    'availability.json',
    (a) => a.tutorId === tutorId
  );

  if (availabilities.length === 0) {
    return 'Gia sư chưa cài đặt lịch rảnh. Vui lòng liên hệ gia sư để biết thêm thông tin.';
  }

  const availability = availabilities[0];
  const matchingSlot = availability.timeSlots.find(
    (slot) => slot.day.toLowerCase() === preferredDay
  );

  if (!matchingSlot) {
    return `Gia sư không có lịch rảnh vào ${preferredDay}. Vui lòng chọn ngày khác.`;
  }

  // Check if preferred time is within availability slot
  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const availStart = parseTime(matchingSlot.startTime);
  const availEnd = parseTime(matchingSlot.endTime);
  const preferredStartMin = parseTime(preferredStartTimeStr);
  const preferredEndMin = parseTime(preferredEndTimeStr);

  if (preferredStartMin < availStart || preferredEndMin > availEnd) {
    return `Thời gian mong muốn phải nằm trong khoảng ${matchingSlot.startTime} - ${matchingSlot.endTime} của gia sư vào ${preferredDay}.`;
  }

  // 2. Check for conflicts with existing sessions (excluding current session)
  const existingSessions = await storage.find<Session>(
    'sessions.json',
    (s) => s.tutorId === tutorId && 
           s.id !== excludeSessionId && 
           (s.status === SessionStatus.CONFIRMED || s.status === SessionStatus.PENDING) &&
           !s.classId // Only check individual sessions
  );

  for (const existingSession of existingSessions) {
    const existingStart = new Date(existingSession.startTime);
    const existingEnd = new Date(existingSession.endTime);

    // Check if sessions overlap (same date and overlapping times)
    if (
      existingStart.toDateString() === preferredStart.toDateString() &&
      (
        (preferredStart >= existingStart && preferredStart < existingEnd) ||
        (preferredEnd > existingStart && preferredEnd <= existingEnd) ||
        (preferredStart <= existingStart && preferredEnd >= existingEnd)
      )
    ) {
      return `Thời gian mong muốn trùng với buổi học khác (${existingSession.subject}, ${existingStart.toLocaleString('vi-VN')}). Vui lòng chọn thời gian khác.`;
    }
  }

  // 3. Check for conflicts with tutor's classes
  const tutorClasses = await storage.find<Class>(
    'classes.json',
    (c) => c.tutorId === tutorId && 
           c.status !== ClassStatus.INACTIVE &&
           c.day.toLowerCase() === preferredDay
  );

  for (const classItem of tutorClasses) {
    const classStart = parseTime(classItem.startTime);
    const classEnd = parseTime(classItem.endTime);

    // Check if preferred time overlaps with class time
    if (
      (preferredStartMin >= classStart && preferredStartMin < classEnd) ||
      (preferredEndMin > classStart && preferredEndMin <= classEnd) ||
      (preferredStartMin <= classStart && preferredEndMin >= classEnd)
    ) {
      return `Thời gian mong muốn trùng với lịch lớp ${classItem.code} (${classItem.startTime} - ${classItem.endTime}). Vui lòng chọn thời gian khác.`;
    }
  }

  return null; // No validation errors
}

/**
 * POST /api/session-requests
 */
export async function createSessionRequestHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const { sessionId, type, reason, preferredStartTime, preferredEndTime, alternativeSessionId } = req.body;

    // Only students can create requests
    if (currentUser.role !== UserRole.STUDENT) {
      return res.status(403).json(
        errorResponse('Chỉ sinh viên mới có thể tạo yêu cầu hủy/đổi lịch')
      );
    }

    // Get session details - handle virtual session for class
    let session: Session | null = await storage.findById<Session>('sessions.json', sessionId);
    let classData: Class | null = null;
    
    // If session not found, check if it's a virtual session for class
    if (!session && sessionId.startsWith('class_')) {
      const classId = sessionId.replace('class_', '').replace('_next_session', '');
      classData = await storage.findById<Class>('classes.json', classId);
      
      if (!classData) {
        return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
      }

      // Check if student is enrolled in class
      const enrollments = await storage.find('enrollments.json',
        (e: any) => e.classId === classId && e.studentId === currentUser.userId && e.status === 'active'
      );

      if (enrollments.length === 0) {
        return res.status(403).json(
          errorResponse('Bạn không có quyền tạo yêu cầu cho lớp học này')
        );
      }

      // Find the next upcoming session for this class
      const classSessions = await storage.find<Session>('sessions.json',
        (s: Session) => 
          s.classId === classId && 
          s.status === SessionStatus.CONFIRMED &&
          new Date(s.startTime) >= new Date()
      );

      if (classSessions.length > 0) {
        // Use the earliest upcoming session
        session = classSessions.sort((a, b) => 
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )[0];
      } else {
        // No upcoming session found, create a placeholder session object
        session = {
          id: sessionId,
          studentIds: [],
          tutorId: classData.tutorId,
          subject: classData.subject,
          status: SessionStatus.CONFIRMED,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          duration: classData.duration,
          isOnline: classData.isOnline || false,
          classId: classData.id,
          createdAt: now(),
          updatedAt: now()
        } as Session;
      }
    }

    if (!session) {
      return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
    }

    // Check if session belongs to student (for real sessions)
    if (session.id !== sessionId && !session.studentIds?.includes(currentUser.userId)) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền tạo yêu cầu cho buổi học này')
      );
    }

    // Check if session status allows requests
    if (session.status !== SessionStatus.CONFIRMED && session.status !== SessionStatus.PENDING) {
      return res.status(400).json(
        errorResponse('Buổi học này không thể hủy hoặc đổi lịch (đã hoàn thành hoặc đã hủy)')
      );
    }

    // Check for duplicate pending request
    const existingRequests = await storage.find<SessionRequest>(
      'session-requests.json',
      (r) => 
        r.sessionId === sessionId &&
        r.studentId === currentUser.userId &&
        r.status === RequestStatus.PENDING
    );

    if (existingRequests.length > 0) {
      return res.status(400).json(
        errorResponse('Bạn đã có yêu cầu đang chờ xử lý cho buổi học này')
      );
    }

    // Validate preferred time for reschedule requests (only for individual sessions, not class with alternative)
    if (type === RequestType.RESCHEDULE && preferredStartTime && preferredEndTime && !alternativeSessionId) {
      const validationError = await validateRescheduleTime(
        session.tutorId,
        preferredStartTime,
        preferredEndTime,
        sessionId // Exclude current session from conflict check
      );

      if (validationError) {
        return res.status(400).json(errorResponse(validationError));
      }
    }

    // Validate alternative session/class for class reschedule
    if (type === RequestType.RESCHEDULE && alternativeSessionId) {
      // Check if alternative is a class (starts with 'class_') or a session
      const isAlternativeClass = alternativeSessionId.startsWith('class_');
      
      if (isAlternativeClass) {
        // Validate alternative class
        const altClass = await storage.findById<Class>('classes.json', alternativeSessionId);
        if (!altClass) {
          return res.status(404).json(errorResponse('Không tìm thấy lớp học thay thế'));
        }

        // Verify alternative class belongs to same tutor and subject
        if (altClass.tutorId !== session.tutorId || altClass.subject !== session.subject) {
          return res.status(400).json(errorResponse('Lớp học thay thế phải cùng gia sư và môn học'));
        }

        // Check if alternative class has available slots
        if (altClass.currentEnrollment >= altClass.maxStudents) {
          return res.status(400).json(errorResponse('Lớp học thay thế đã đầy'));
        }

        // Check if student is not already enrolled in alternative class
        const existingEnrollments = await storage.find('enrollments.json',
          (e: any) => e.classId === alternativeSessionId && e.studentId === currentUser.userId && e.status === 'active'
        );
        if (existingEnrollments.length > 0) {
          return res.status(400).json(errorResponse('Bạn đã tham gia lớp học thay thế này rồi'));
        }
      } else {
        // Validate alternative session
        const altSession = await storage.findById<Session>('sessions.json', alternativeSessionId);
        if (!altSession) {
          return res.status(404).json(errorResponse('Không tìm thấy buổi học thay thế'));
        }

        // Verify alternative session belongs to same tutor and subject
        if (altSession.tutorId !== session.tutorId || altSession.subject !== session.subject) {
          return res.status(400).json(errorResponse('Buổi học thay thế phải cùng gia sư và môn học'));
        }

        // Check if alternative session has available slots
        const maxStudents = altSession.classId ? 10 : 5;
        const currentStudents = altSession.studentIds?.length || 0;
        if (currentStudents >= maxStudents) {
          return res.status(400).json(errorResponse('Buổi học thay thế đã đầy'));
        }

        // Check if student is not already in alternative session
        if (altSession.studentIds?.includes(currentUser.userId)) {
          return res.status(400).json(errorResponse('Bạn đã tham gia buổi học thay thế này rồi'));
        }
      }
    }

    // Create request
    const newRequest: SessionRequest = {
      id: generateId('req'),
      sessionId: sessionId,
      studentId: currentUser.userId,
      tutorId: session.tutorId,
      classId: session.classId, // Copy from session to distinguish class vs individual
      type: type,
      status: RequestStatus.PENDING,
      reason: reason,
      preferredStartTime: preferredStartTime,
      preferredEndTime: preferredEndTime,
      alternativeSessionId: alternativeSessionId, // For class reschedule - selected alternative session
      createdAt: now(),
      updatedAt: now()
    };

    await storage.create('session-requests.json', newRequest);

    // Create notification for tutor
    const notificationType = type === RequestType.CANCEL
      ? NotificationType.SESSION_CANCEL_REQUEST
      : NotificationType.SESSION_RESCHEDULE_REQUEST;

    const student = await storage.findById<User>('users.json', currentUser.userId);
    const notification: Notification = {
      id: generateId('notif'),
      userId: session.tutorId,
      type: notificationType,
      title: type === RequestType.CANCEL ? 'Yêu cầu hủy buổi học' : 'Yêu cầu đổi lịch buổi học',
      message: `${student?.name || currentUser.email} đã gửi yêu cầu ${type === RequestType.CANCEL ? 'hủy' : 'đổi lịch'} buổi học ${session.subject}`,
      read: false,
      link: `/tutor/cancel-reschedule`,
      metadata: {
        requestId: newRequest.id,
        sessionId: sessionId,
        type: type,
        classId: session.classId
      },
      createdAt: now()
    };
    await storage.create('notifications.json', notification);

    // Get enriched request data
    const tutor = await storage.findById<User>('users.json', session.tutorId);
    let classInfo = null;
    
    if (session.classId) {
      const classItem = await storage.findById<Class>('classes.json', session.classId);
      if (classItem) {
        classInfo = {
          id: classItem.id,
          code: classItem.code,
          subject: classItem.subject
        };
      }
    }

    return res.status(201).json(
      successResponse(
        {
          ...newRequest,
          session: {
            id: session.id,
            subject: session.subject,
            topic: session.topic,
            startTime: session.startTime,
            endTime: session.endTime
          },
          student: student ? {
            id: student.id,
            name: student.name,
            email: student.email
          } : null,
          tutor: tutor ? {
            id: tutor.id,
            name: tutor.name,
            email: tutor.email
          } : null,
          class: classInfo
        },
        'Tạo yêu cầu thành công'
      )
    );
  } catch (error: any) {
    console.error('Create session request error:', error);
    return res.status(500).json(
      errorResponse('Lỗi tạo yêu cầu: ' + error.message)
    );
  }
}

