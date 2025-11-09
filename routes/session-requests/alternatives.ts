/**
 * Get alternative sessions for class reschedule
 * GET /api/session-requests/alternatives?sessionId=xxx&classId=xxx
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { 
  Session, 
  Class,
  SessionStatus,
  AuthRequest
} from '../../lib/types.js';
import { successResponse, errorResponse } from '../../lib/utils.js';

export async function getAlternativeSessionsHandler(req: AuthRequest, res: Response) {
  try {
    const { sessionId, classId } = req.query;
    const currentUser = req.user!;

    if (!sessionId && !classId) {
      return res.status(400).json(
        errorResponse('sessionId hoặc classId là bắt buộc')
      );
    }

    let originalSession: Session | null = null;
    let classData: Class | null = null;
    let tutorId: string = '';
    let subject: string = '';
    let excludeDate: Date | null = null;

    // Get original session or class info
    if (sessionId && typeof sessionId === 'string') {
      originalSession = await storage.findById<Session>('sessions.json', sessionId);
      if (!originalSession) {
        return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
      }
      
      // Check if student is enrolled
      if (!originalSession.studentIds?.includes(currentUser.userId)) {
        return res.status(403).json(
          errorResponse('Bạn không có quyền xem buổi học này')
        );
      }

      tutorId = originalSession.tutorId;
      subject = originalSession.subject;
      excludeDate = new Date(originalSession.startTime);
      
      // Get class if exists
      if (originalSession.classId) {
        classData = await storage.findById<Class>('classes.json', originalSession.classId);
      }
    } else if (classId && typeof classId === 'string') {
      classData = await storage.findById<Class>('classes.json', classId);
      if (!classData) {
        return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
      }

      // Check if student is enrolled
      const enrollments = await storage.find('enrollments.json', 
        (e: any) => e.classId === classId && e.studentId === currentUser.userId && e.status === 'active'
      );
      
      if (enrollments.length === 0) {
        return res.status(403).json(
          errorResponse('Bạn không có quyền xem lớp học này')
        );
      }

      tutorId = classData.tutorId;
      subject = classData.subject;
      
      // Get the day of week for this class to exclude
      const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        .indexOf(classData.day.toLowerCase());
      
      if (dayIndex !== -1) {
        // Get next occurrence of this day
        const today = new Date();
        const currentDay = today.getDay();
        const mappedDay = currentDay === 0 ? 6 : currentDay - 1; // Map Sunday to 6
        let daysUntil = (dayIndex - mappedDay + 7) % 7;
        if (daysUntil === 0) daysUntil = 7; // If today, get next week
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysUntil);
        nextDate.setHours(parseInt(classData.startTime.split(':')[0]), parseInt(classData.startTime.split(':')[1]), 0, 0);
        excludeDate = nextDate;
      }
    }

    if (!tutorId || !subject) {
      return res.status(400).json(errorResponse('Không thể xác định tutor hoặc môn học'));
    }

    // If this is a class reschedule (classId provided), find alternative classes
    if (classId && typeof classId === 'string' && classData) {
      // Find all classes for the same tutor and subject
      const allClasses = await storage.find<Class>('classes.json', 
        (c: Class) => 
          c.tutorId === tutorId && 
          c.subject === subject &&
          c.status === 'active' &&
          c.id !== classId // Exclude the original class
      );

      // Get student's enrollments to check if already enrolled
      const studentEnrollments = await storage.find('enrollments.json',
        (e: any) => e.studentId === currentUser.userId && e.status === 'active'
      );
      const enrolledClassIds = studentEnrollments.map((e: any) => e.classId);

      // Filter alternative classes
      const alternativeClasses = allClasses
        .filter((altClass: Class) => {
          // Exclude classes on the same day
          if (altClass.day.toLowerCase() === classData.day.toLowerCase()) {
            return false;
          }

          // Check if class has available slots
          if (altClass.currentEnrollment >= altClass.maxStudents) {
            return false;
          }

          // Check if student is not already enrolled in this class
          if (enrolledClassIds.includes(altClass.id)) {
            return false;
          }

          return true;
        })
        .map((altClass: Class) => {
          // Calculate next occurrence of this class
          const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            .indexOf(altClass.day.toLowerCase());
          
          let nextStartTime: Date | null = null;
          if (dayIndex !== -1) {
            const today = new Date();
            const currentDay = today.getDay();
            const mappedDay = currentDay === 0 ? 6 : currentDay - 1; // Map Sunday to 6
            let daysUntil = (dayIndex - mappedDay + 7) % 7;
            if (daysUntil === 0) daysUntil = 7; // If today, get next week
            nextStartTime = new Date(today);
            nextStartTime.setDate(today.getDate() + daysUntil);
            const [hours, minutes] = altClass.startTime.split(':').map(Number);
            nextStartTime.setHours(hours, minutes, 0, 0);
          }

          // Calculate end time
          let nextEndTime: Date | null = null;
          if (nextStartTime) {
            nextEndTime = new Date(nextStartTime.getTime() + altClass.duration * 60000);
          }

          return {
            id: altClass.id,
            subject: altClass.subject,
            startTime: nextStartTime ? nextStartTime.toISOString() : new Date().toISOString(),
            endTime: nextEndTime ? nextEndTime.toISOString() : new Date().toISOString(),
            duration: altClass.duration,
            isOnline: altClass.isOnline || false,
            location: altClass.location,
            classId: altClass.id,
            classInfo: {
              id: altClass.id,
              code: altClass.code,
              subject: altClass.subject,
              day: altClass.day
            },
            currentStudents: altClass.currentEnrollment || 0,
            maxStudents: altClass.maxStudents,
            availableSlots: altClass.maxStudents - (altClass.currentEnrollment || 0),
            isClass: true // Flag to indicate this is a class, not a session
          };
        })
        .sort((a, b) => {
          // Sort by day of week first, then by time
          const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          const aDayIndex = dayOrder.indexOf(a.classInfo.day.toLowerCase());
          const bDayIndex = dayOrder.indexOf(b.classInfo.day.toLowerCase());
          if (aDayIndex !== bDayIndex) {
            return aDayIndex - bDayIndex;
          }
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        })
        .slice(0, 20); // Limit to 20 alternatives

      return res.json(
        successResponse({
          alternatives: alternativeClasses,
          originalSession: null,
          classInfo: {
            id: classData.id,
            code: classData.code,
            subject: classData.subject,
            day: classData.day
          }
        }, 'Danh sách lớp học thay thế')
      );
    }

    // For individual session reschedule, find alternative sessions
    // Find all sessions for the same tutor and subject
    const allSessions = await storage.find<Session>('sessions.json', 
      (s: Session) => 
        s.tutorId === tutorId && 
        s.subject === subject &&
        s.status === SessionStatus.CONFIRMED &&
        new Date(s.startTime) >= new Date() // Only future sessions
    );

      // Filter alternative sessions
      const filteredSessions = allSessions.filter((session: Session) => {
        // Exclude the original session
        if (originalSession && session.id === originalSession.id) {
          return false;
        }

        // Exclude sessions on the same day as the class (if class reschedule)
        if (classData && excludeDate) {
          const sessionDate = new Date(session.startTime);
          const excludeDay = excludeDate.getDay();
          const sessionDay = sessionDate.getDay();
          
          // If same day of week, exclude it
          if (excludeDay === sessionDay) {
            return false;
          }
        }

        // Check if session has available slots
        // For class sessions, check maxStudents from class
        // For individual sessions, check if not full (assuming max 5 students per individual session)
        const maxStudents = session.classId ? 
          (classData?.maxStudents || 10) : 
          5;
        
        const currentStudents = session.studentIds?.length || 0;
        if (currentStudents >= maxStudents) {
          return false;
        }

        // Check if student is not already enrolled in this session
        if (session.studentIds?.includes(currentUser.userId)) {
          return false;
        }

        return true;
      });

      // Fetch class info for all sessions that need it - batch load instead of individual finds
      const sessionClassIds = filteredSessions
        .filter(s => s.classId && (!classData || s.classId !== classData.id))
        .map(s => s.classId)
        .filter((id): id is string => id !== undefined);
      
      // Use batch loading instead of Promise.all with multiple findById
      const classesMap = await storage.findByIds<Class>('classes.json', sessionClassIds);

      // Map sessions with class info
      const alternativeSessions = filteredSessions
        .map((session: Session) => {
          // Get class info if exists
          let classInfo = null;
          if (session.classId) {
            // Try to get class from cache or fetched map
            if (classData && classData.id === session.classId) {
              classInfo = {
                id: classData.id,
                code: classData.code,
                subject: classData.subject
              };
            } else {
              // Get from fetched map
              const sessionClass = classesMap.get(session.classId);
              if (sessionClass) {
                classInfo = {
                  id: sessionClass.id,
                  code: sessionClass.code,
                  subject: sessionClass.subject
                };
              }
            }
          }

          return {
            id: session.id,
            subject: session.subject,
            topic: session.topic,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration,
            isOnline: session.isOnline,
            location: session.location,
            meetingLink: session.meetingLink,
            classId: session.classId,
            classInfo: classInfo,
            currentStudents: session.studentIds?.length || 0,
            maxStudents: session.classId ? (classData?.maxStudents || 10) : 5,
            availableSlots: (session.classId ? (classData?.maxStudents || 10) : 5) - (session.studentIds?.length || 0),
            isClass: false
          };
        })
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 20); // Limit to 20 alternatives

    return res.json(
      successResponse({
        alternatives: alternativeSessions,
        originalSession: originalSession ? {
          id: originalSession.id,
          subject: originalSession.subject,
          startTime: originalSession.startTime,
          endTime: originalSession.endTime,
          classId: originalSession.classId
        } : null,
        classInfo: classData ? {
          id: classData.id,
          code: classData.code,
          subject: classData.subject,
          day: classData.day
        } : null
      }, 'Danh sách buổi học thay thế')
    );
  } catch (error: any) {
    console.error('Get alternative sessions error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách buổi học thay thế: ' + error.message)
    );
  }
}

