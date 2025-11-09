/**
 * Session Request Detail APIs
 * GET /api/session-requests/:id - Get request detail
 * PUT /api/session-requests/:id/approve - Approve request
 * PUT /api/session-requests/:id/reject - Reject request
 * DELETE /api/session-requests/:id - Withdraw request (student only)
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
  RequestStatus
} from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../lib/utils.js';

/**
 * GET /api/session-requests/:id
 */
export async function getSessionRequestHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const request = await storage.findById<SessionRequest>('session-requests.json', id);
    if (!request) {
      return res.status(404).json(errorResponse('Không tìm thấy yêu cầu'));
    }

    // Authorization check
    if (
      currentUser.role !== UserRole.MANAGEMENT &&
      request.studentId !== currentUser.userId &&
      request.tutorId !== currentUser.userId
    ) {
      return res.status(403).json(errorResponse('Bạn không có quyền xem yêu cầu này'));
    }

    // Populate related data - batch load in parallel instead of sequential
    const userIds = [request.studentId, request.tutorId].filter(Boolean);
    const idsToLoad = {
      sessionId: request.sessionId,
      userIds: userIds,
      classId: request.classId
    };

    // Load all data in parallel (3 read operations instead of 3 sequential)
    const [sessionsMap, usersMap, classesMap] = await Promise.all([
      storage.findByIds<Session>('sessions.json', [idsToLoad.sessionId].filter(Boolean)),
      storage.findByIds<User>('users.json', idsToLoad.userIds),
      idsToLoad.classId 
        ? storage.findByIds<Class>('classes.json', [idsToLoad.classId])
        : Promise.resolve(new Map<string, Class>())
    ]);

    const session = sessionsMap.get(request.sessionId) || null;
    const student = usersMap.get(request.studentId) || null;
    const tutor = usersMap.get(request.tutorId) || null;
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

    return res.json(
      successResponse({
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
      })
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy thông tin yêu cầu: ' + error.message)
    );
  }
}

/**
 * PUT /api/session-requests/:id/approve
 */
export async function approveSessionRequestHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { responseMessage, newStartTime, newEndTime, alternativeSessionId } = req.body;
    const currentUser = req.user!;

    const request = await storage.findById<SessionRequest>('session-requests.json', id);
    if (!request) {
      return res.status(404).json(errorResponse('Không tìm thấy yêu cầu'));
    }

    // Only tutor can approve
    if (request.tutorId !== currentUser.userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(errorResponse('Bạn không có quyền phê duyệt yêu cầu này'));
    }

    // Check if request is still pending
    if (request.status !== RequestStatus.PENDING) {
      return res.status(400).json(errorResponse('Yêu cầu này đã được xử lý rồi'));
    }

    // Get session - handle virtual session for class
    // For class reschedule with alternative class, we don't need to find the original session
    const finalAlternativeSessionId = alternativeSessionId || request.alternativeSessionId;
    const isClassRescheduleWithAlternative = request.classId && finalAlternativeSessionId && finalAlternativeSessionId.startsWith('class_');
    
    let session: Session | null = null;
    
    // Only need to find session if it's not a class-to-class reschedule
    if (!isClassRescheduleWithAlternative) {
      session = await storage.findById<Session>('sessions.json', request.sessionId);
      
      // If session not found, check if it's a virtual session for class
      if (!session && request.sessionId.startsWith('class_')) {
        if (!request.classId) {
          return res.status(400).json(errorResponse('Không tìm thấy thông tin lớp học'));
        }

        // Find the next upcoming session for this class
        const classSessions = await storage.find<Session>('sessions.json',
          (s: Session) => 
            s.classId === request.classId && 
            s.status === SessionStatus.CONFIRMED &&
            new Date(s.startTime) >= new Date()
        );

        if (classSessions.length > 0) {
          session = classSessions.sort((a, b) => 
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )[0];
        }
      }

      // Only require session if it's not a class-to-class reschedule
      if (!session && !isClassRescheduleWithAlternative) {
        return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
      }
    }

    // Update request status
    const updatedRequest = await storage.update<SessionRequest>('session-requests.json', id, {
      status: RequestStatus.APPROVED,
      responseMessage: responseMessage || 'Yêu cầu của bạn đã được chấp nhận.',
      updatedAt: now()
    });

    // Update session based on request type
    if (request.type === RequestType.CANCEL) {
      // Cancel the session
      await storage.update<Session>('sessions.json', request.sessionId, {
        status: SessionStatus.CANCELLED,
        cancelledBy: request.studentId,
        cancelReason: request.reason,
        updatedAt: now()
      });
    } else if (request.type === RequestType.RESCHEDULE) {
      // For class reschedule with alternative class or session
      const finalAlternativeSessionId = alternativeSessionId || request.alternativeSessionId;
      if (request.classId && finalAlternativeSessionId) {
        // Check if alternative is a class (starts with 'class_') or a session
        const isAlternativeClass = finalAlternativeSessionId.startsWith('class_');
        
        if (isAlternativeClass) {
          // Handle class-to-class reschedule
          // 1. Unenroll student from original class
          const originalEnrollments = await storage.find('enrollments.json',
            (e: any) => e.classId === request.classId && e.studentId === request.studentId && e.status === 'active'
          );
          
          for (const enrollment of originalEnrollments) {
            await storage.update('enrollments.json', enrollment.id, {
              status: 'inactive',
              updatedAt: now()
            });
          }

          // 2. Decrease currentEnrollment of original class
          const originalClass = await storage.findById<Class>('classes.json', request.classId);
          if (originalClass && originalClass.currentEnrollment > 0) {
            await storage.update<Class>('classes.json', request.classId, {
              currentEnrollment: originalClass.currentEnrollment - 1,
              updatedAt: now()
            });
          }

          // 3. Check if student is already enrolled in alternative class
          const existingEnrollments = await storage.find('enrollments.json',
            (e: any) => e.classId === finalAlternativeSessionId && e.studentId === request.studentId
          );

          if (existingEnrollments.length === 0) {
            // 4. Check if alternative class has available slots
            const alternativeClass = await storage.findById<Class>('classes.json', finalAlternativeSessionId);
            if (!alternativeClass) {
              return res.status(404).json(errorResponse('Không tìm thấy lớp học thay thế'));
            }

            if (alternativeClass.currentEnrollment >= alternativeClass.maxStudents) {
              return res.status(400).json(errorResponse('Lớp học thay thế đã đầy'));
            }

            // 5. Enroll student to alternative class
            const newEnrollment = {
              id: generateId('enroll'),
              classId: finalAlternativeSessionId,
              studentId: request.studentId,
              status: 'active',
              enrolledAt: now(),
              createdAt: now(),
              updatedAt: now()
            };
            await storage.create('enrollments.json', newEnrollment);

            // 6. Increase currentEnrollment of alternative class
            await storage.update<Class>('classes.json', finalAlternativeSessionId, {
              currentEnrollment: (alternativeClass.currentEnrollment || 0) + 1,
              updatedAt: now()
            });
          }
        } else {
          // Handle class-to-session reschedule (original logic)
          // Remove student from original session (if session exists)
          if (session && session.studentIds?.includes(request.studentId)) {
            const updatedStudentIds = session.studentIds.filter(id => id !== request.studentId);
            await storage.update<Session>('sessions.json', session.id, {
              studentIds: updatedStudentIds,
              updatedAt: now()
            });
          }

          // Add student to alternative session
          const alternativeSession = await storage.findById<Session>('sessions.json', finalAlternativeSessionId);
          if (!alternativeSession) {
            return res.status(404).json(errorResponse('Không tìm thấy buổi học thay thế'));
          }

          // Check if alternative session has available slots
          const maxStudents = alternativeSession.classId ? 10 : 5; // Assuming max 10 for class, 5 for individual
          const currentStudents = alternativeSession.studentIds?.length || 0;
          if (currentStudents >= maxStudents) {
            return res.status(400).json(errorResponse('Buổi học thay thế đã đầy'));
          }

          // Add student to alternative session
          const newStudentIds = alternativeSession.studentIds?.includes(request.studentId)
            ? alternativeSession.studentIds
            : [...(alternativeSession.studentIds || []), request.studentId];

          await storage.update<Session>('sessions.json', finalAlternativeSessionId, {
            studentIds: newStudentIds,
            updatedAt: now()
          });
        }
      } else {
        // Regular reschedule - update session time
        // Only require new time if not using alternative session
        if (!finalAlternativeSessionId) {
          const finalStartTime = newStartTime || request.preferredStartTime;
          const finalEndTime = newEndTime || request.preferredEndTime;

          if (!finalStartTime || !finalEndTime) {
            return res.status(400).json(errorResponse('Thời gian mới là bắt buộc cho yêu cầu đổi lịch'));
          }

          const duration = Math.round(
            (new Date(finalEndTime).getTime() - new Date(finalStartTime).getTime()) / (1000 * 60)
          );

          await storage.update<Session>('sessions.json', request.sessionId, {
            startTime: finalStartTime,
            endTime: finalEndTime,
            duration: duration,
            status: SessionStatus.RESCHEDULED,
            rescheduledFrom: session?.startTime || request.preferredStartTime || finalStartTime,
            updatedAt: now()
          });
        }
      }
    }

    // Create notification for student
    const notificationType = request.type === RequestType.CANCEL
      ? NotificationType.SESSION_CANCELLED
      : NotificationType.SESSION_RESCHEDULED;

    const tutor = await storage.findById<User>('users.json', request.tutorId);
    
    // Get subject for notification message
    let subjectName = 'buổi học';
    if (session?.subject) {
      subjectName = session.subject;
    } else if (request.classId) {
      const classData = await storage.findById<Class>('classes.json', request.classId);
      if (classData) {
        subjectName = classData.subject;
      }
    }
    
    const notification: Notification = {
      id: generateId('notif'),
      userId: request.studentId,
      type: notificationType,
      title: request.type === RequestType.CANCEL 
        ? 'Yêu cầu hủy buổi học đã được chấp nhận'
        : 'Yêu cầu đổi lịch buổi học đã được chấp nhận',
      message: `${tutor?.name || 'Gia sư'} đã chấp nhận yêu cầu ${request.type === RequestType.CANCEL ? 'hủy' : 'đổi lịch'} buổi học ${subjectName}`,
      read: false,
      link: request.classId ? `/student/class/${request.classId}` : `/student/session/${request.sessionId}`,
      metadata: {
        requestId: request.id,
        sessionId: request.sessionId,
        classId: request.classId,
        responseMessage: responseMessage
      },
      createdAt: now()
    };
    await storage.create('notifications.json', notification);

    return res.json(
      successResponse(updatedRequest, 'Phê duyệt yêu cầu thành công')
    );
  } catch (error: any) {
    console.error('Approve session request error:', error);
    return res.status(500).json(
      errorResponse('Lỗi phê duyệt yêu cầu: ' + error.message)
    );
  }
}

/**
 * PUT /api/session-requests/:id/reject
 */
export async function rejectSessionRequestHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { responseMessage } = req.body;
    const currentUser = req.user!;

    const request = await storage.findById<SessionRequest>('session-requests.json', id);
    if (!request) {
      return res.status(404).json(errorResponse('Không tìm thấy yêu cầu'));
    }

    // Only tutor can reject
    if (request.tutorId !== currentUser.userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(errorResponse('Bạn không có quyền từ chối yêu cầu này'));
    }

    // Check if request is still pending
    if (request.status !== RequestStatus.PENDING) {
      return res.status(400).json(errorResponse('Yêu cầu này đã được xử lý rồi'));
    }

    const session = await storage.findById<Session>('sessions.json', request.sessionId);
    if (!session) {
      return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
    }

    // Update request status
    const updatedRequest = await storage.update<SessionRequest>('session-requests.json', id, {
      status: RequestStatus.REJECTED,
      responseMessage: responseMessage,
      updatedAt: now()
    });

    // Create notification for student
    const tutor = await storage.findById<User>('users.json', request.tutorId);
    const notification: Notification = {
      id: generateId('notif'),
      userId: request.studentId,
      type: NotificationType.SESSION_CANCELLED, // Use cancelled type for rejection notification
      title: 'Yêu cầu đã bị từ chối',
      message: `${tutor?.name || 'Gia sư'} đã từ chối yêu cầu ${request.type === RequestType.CANCEL ? 'hủy' : 'đổi lịch'} buổi học ${session.subject}: ${responseMessage}`,
      read: false,
      link: `/student/session/${request.sessionId}`,
      metadata: {
        requestId: request.id,
        sessionId: request.sessionId,
        type: 'rejection',
        responseMessage: responseMessage
      },
      createdAt: now()
    };
    await storage.create('notifications.json', notification);

    return res.json(
      successResponse(updatedRequest, 'Từ chối yêu cầu thành công')
    );
  } catch (error: any) {
    console.error('Reject session request error:', error);
    return res.status(500).json(
      errorResponse('Lỗi từ chối yêu cầu: ' + error.message)
    );
  }
}

/**
 * DELETE /api/session-requests/:id
 * Student can withdraw pending requests
 * Tutor can delete processed requests (approved/rejected)
 */
export async function withdrawSessionRequestHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const request = await storage.findById<SessionRequest>('session-requests.json', id);
    if (!request) {
      return res.status(404).json(errorResponse('Không tìm thấy yêu cầu'));
    }

    // Student can withdraw their own pending request
    if (request.studentId === currentUser.userId && request.status === RequestStatus.PENDING) {
      await storage.update<SessionRequest>('session-requests.json', id, {
        status: RequestStatus.WITHDRAWN,
        updatedAt: now()
      });
      return res.json(
        successResponse(null, 'Rút lại yêu cầu thành công')
      );
    }

    // Tutor can delete processed requests (approved/rejected)
    if (request.tutorId === currentUser.userId && 
        (request.status === RequestStatus.APPROVED || request.status === RequestStatus.REJECTED)) {
      await storage.delete('session-requests.json', id);
      return res.json(
        successResponse(null, 'Xóa yêu cầu đã xử lý thành công')
      );
    }

    // Management can delete any request
    if (currentUser.role === UserRole.MANAGEMENT) {
      await storage.delete('session-requests.json', id);
      return res.json(
        successResponse(null, 'Xóa yêu cầu thành công')
      );
    }

    return res.status(403).json(errorResponse('Bạn không có quyền xóa yêu cầu này'));
  } catch (error: any) {
    console.error('Delete/Withdraw session request error:', error);
    return res.status(500).json(
      errorResponse('Lỗi xóa yêu cầu: ' + error.message)
    );
  }
}

