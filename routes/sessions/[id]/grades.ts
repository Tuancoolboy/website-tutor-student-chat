/**
 * Grades API for a specific session or class
 * GET /api/sessions/:id/grades - Get grades (tutor sees all, student sees own)
 * GET /api/sessions/:id/grades/summary - Get grade summary
 * Supports both sessionId and classId
 */

import { Response } from 'express';
import { storage } from '../../../lib/storage.js';
import { Session, Class, Grade, GradeSummary, UserRole, Enrollment } from '../../../lib/types.js';
import { AuthRequest } from '../../../lib/middleware.js';
import { successResponse, errorResponse } from '../../../lib/utils.js';

/**
 * GET /api/sessions/:id/grades
 * Supports both sessionId and classId
 */
export async function getGradesHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const isClassView = id.startsWith('class_');
    let tutorId: string;
    let canAccess = false;

    if (isClassView) {
      // Get class
      const classItem = await storage.findById<Class>('classes.json', id);
      if (!classItem) {
        return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
      }
      tutorId = classItem.tutorId;

      // Authorization: tutor, enrolled students, or management
      if (currentUser.role === UserRole.MANAGEMENT || currentUser.userId === tutorId) {
        canAccess = true;
      } else if (currentUser.role === UserRole.STUDENT) {
        // Check if student is enrolled
        const enrollments = await storage.read<Enrollment>('enrollments.json');
        const isEnrolled = enrollments.some(
          e => e.classId === id && e.studentId === currentUser.userId && e.status === 'active'
        );
        canAccess = isEnrolled;
      }
    } else {
      // Get session
      const session = await storage.findById<Session>('sessions.json', id);
      if (!session) {
        return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
      }
      tutorId = session.tutorId;

      // Authorization check
      canAccess = (
        currentUser.role === UserRole.MANAGEMENT ||
        session.studentIds.includes(currentUser.userId) ||
        session.tutorId === currentUser.userId
      );
    }

    if (!canAccess) {
      return res.status(403).json(errorResponse('Bạn không có quyền xem điểm'));
    }

    const allGrades = await storage.read<Grade>('grades.json');
    let entityGrades = allGrades.filter(g => 
      isClassView ? g.classId === id : g.sessionId === id
    );

    // If student, only show their own grades
    if (currentUser.role === UserRole.STUDENT) {
      entityGrades = entityGrades.filter(g => g.studentId === currentUser.userId);
    }

    return res.json(successResponse(entityGrades));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi lấy danh sách điểm: ' + error.message));
  }
}

/**
 * GET /api/sessions/:id/grades/summary
 * Supports both sessionId and classId
 */
export async function getGradesSummaryHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const { studentId } = req.query;

    const isClassView = id.startsWith('class_');
    let tutorId: string;
    let canAccess = false;

    if (isClassView) {
      // Get class
      const classItem = await storage.findById<Class>('classes.json', id);
      if (!classItem) {
        return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
      }
      tutorId = classItem.tutorId;

      // Authorization: tutor, enrolled students, or management
      if (currentUser.role === UserRole.MANAGEMENT || currentUser.userId === tutorId) {
        canAccess = true;
      } else if (currentUser.role === UserRole.STUDENT) {
        // Check if student is enrolled
        const enrollments = await storage.read<Enrollment>('enrollments.json');
        const isEnrolled = enrollments.some(
          e => e.classId === id && e.studentId === currentUser.userId && e.status === 'active'
        );
        canAccess = isEnrolled;
      }
    } else {
      // Get session
      const session = await storage.findById<Session>('sessions.json', id);
      if (!session) {
        return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
      }
      tutorId = session.tutorId;

      // Authorization check
      canAccess = (
        currentUser.role === UserRole.MANAGEMENT ||
        session.studentIds.includes(currentUser.userId) ||
        session.tutorId === currentUser.userId
      );
    }

    if (!canAccess) {
      return res.status(403).json(errorResponse('Bạn không có quyền xem điểm'));
    }

    // Determine which student's grades to get
    let targetStudentId: string;
    if (currentUser.role === UserRole.STUDENT) {
      targetStudentId = currentUser.userId;
    } else if (currentUser.role === UserRole.TUTOR || currentUser.role === UserRole.MANAGEMENT) {
      targetStudentId = (studentId as string) || currentUser.userId;
    } else {
      targetStudentId = currentUser.userId;
    }

    const allGrades = await storage.read<Grade>('grades.json');
    const studentGrades = allGrades.filter(
      g => (isClassView ? g.classId === id : g.sessionId === id) && g.studentId === targetStudentId
    );

    const totalPoints = studentGrades.reduce((sum, g) => sum + g.maxScore, 0);
    const earnedPoints = studentGrades.reduce((sum, g) => sum + g.score, 0);
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    const summary: GradeSummary = {
      studentId: targetStudentId,
      sessionId: isClassView ? undefined : id,
      classId: isClassView ? id : undefined,
      totalPoints,
      earnedPoints,
      percentage,
      grades: studentGrades
    };

    return res.json(successResponse(summary));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi lấy tổng kết điểm: ' + error.message));
  }
}

