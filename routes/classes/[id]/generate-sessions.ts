/**
 * Generate Sessions for Class
 * POST /api/classes/:id/generate-sessions
 */

import { Response } from 'express';
import { storage } from '../../../lib/storage.js';
import { Class, Session, SessionStatus, Enrollment, Notification, NotificationType } from '../../../lib/types.js';
import { AuthRequest } from '../../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../../lib/utils.js';

/**
 * Helper function to get next occurrence of a day
 */
function getNextDayOccurrence(startDate: Date, targetDay: string): Date {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDayIndex = days.indexOf(targetDay.toLowerCase());
  
  const result = new Date(startDate);
  const currentDay = result.getDay();
  
  let daysToAdd = targetDayIndex - currentDay;
  if (daysToAdd < 0) {
    daysToAdd += 7;
  }
  
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

/**
 * POST /api/classes/:id/generate-sessions
 */
export async function generateSessionsHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    // Get class details
    const classItem = await storage.findById<Class>('classes.json', id);
    if (!classItem) {
      return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
    }

    // Authorization: only the tutor can generate sessions
    if (classItem.tutorId !== currentUser.userId) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền tạo buổi học cho lớp này')
      );
    }

    // Get all active enrollments for this class
    const enrollments = await storage.find<Enrollment>(
      'enrollments.json',
      (e) => e.classId === id && e.status === 'active'
    );

    const studentIds = enrollments.map(e => e.studentId);

    // Parse semester dates
    const semesterStart = new Date(classItem.semesterStart);
    const semesterEnd = new Date(classItem.semesterEnd);

    // Find first occurrence of the class day
    let currentDate = getNextDayOccurrence(semesterStart, classItem.day);

    const sessions: Session[] = [];
    let sessionCount = 0;

    // Generate sessions for each week
    while (currentDate <= semesterEnd) {
      // Parse class time
      const [startHour, startMinute] = classItem.startTime.split(':').map(Number);
      const [endHour, endMinute] = classItem.endTime.split(':').map(Number);

      // Create start and end datetime
      const sessionStart = new Date(currentDate);
      sessionStart.setHours(startHour, startMinute, 0, 0);

      const sessionEnd = new Date(currentDate);
      sessionEnd.setHours(endHour, endMinute, 0, 0);

      // Create session
      const session: Session = {
        id: generateId('ses'),
        classId: classItem.id,
        studentIds: studentIds,
        tutorId: classItem.tutorId,
        subject: classItem.subject,
        topic: `Buổi ${sessionCount + 1} - ${classItem.subject}`,
        description: classItem.description,
        status: SessionStatus.CONFIRMED,
        startTime: sessionStart.toISOString(),
        endTime: sessionEnd.toISOString(),
        duration: classItem.duration,
        isOnline: classItem.isOnline,
        location: classItem.location,
        notes: `Tự động tạo từ lớp ${classItem.code}`,
        createdAt: now(),
        updatedAt: now()
      };

      sessions.push(session);
      sessionCount++;

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }

    // Save all sessions - batch create instead of loop
    if (sessions.length > 0) {
      await storage.createMany('sessions.json', sessions);
    }

    // Create notification for enrolled students - batch create
    if (studentIds.length > 0) {
      const notifications: Notification[] = studentIds.map(studentId => ({
        id: generateId('notif'),
        userId: studentId,
        type: NotificationType.SESSION_BOOKING,
        title: 'Lịch học mới được tạo',
        message: `${sessionCount} buổi học cho lớp ${classItem.code} - ${classItem.subject} đã được tạo`,
        read: false,
        link: `/classes/${classItem.id}`,
        createdAt: now()
      }));
      await storage.createMany('notifications.json', notifications);
    }

    return res.status(201).json(
      successResponse(
        { 
          sessionsCreated: sessionCount,
          sessions: sessions,
          enrolledStudents: studentIds.length
        },
        `Đã tạo ${sessionCount} buổi học thành công`
      )
    );
  } catch (error: any) {
    console.error('Generate sessions error:', error);
    return res.status(500).json(
      errorResponse('Lỗi tạo buổi học: ' + error.message)
    );
  }
}

