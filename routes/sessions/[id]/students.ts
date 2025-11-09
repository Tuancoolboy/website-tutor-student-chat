/**
 * Students API for a specific session
 * GET /api/sessions/:id/students - Get all students in a session
 * POST /api/sessions/:id/students - Add student to session (tutor only)
 * DELETE /api/sessions/:id/students/:studentId - Remove student from session (tutor only)
 */

import { Response } from 'express';
import { storage } from '../../../lib/storage.js';
import { Session, User, UserRole } from '../../../lib/types.js';
import { AuthRequest } from '../../../lib/middleware.js';
import { successResponse, errorResponse, now } from '../../../lib/utils.js';

/**
 * GET /api/sessions/:id/students
 */
export async function getSessionStudentsHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const session = await storage.findById<Session>('sessions.json', id);
    if (!session) {
      return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
    }

    if (
      currentUser.role !== UserRole.MANAGEMENT &&
      !session.studentIds.includes(currentUser.userId) &&
      session.tutorId !== currentUser.userId
    ) {
      return res.status(403).json(errorResponse('Bạn không có quyền xem danh sách học sinh'));
    }

    // Get student details - batch load instead of reading all users
    const studentsMap = await storage.findByIds<User>('users.json', session.studentIds);
    const students = Array.from(studentsMap.values());

    // Remove sensitive data
    const studentsData = students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      avatar: s.avatar,
      major: (s as any).major,
      year: (s as any).year
    }));

    return res.json(successResponse(studentsData));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi lấy danh sách học sinh: ' + error.message));
  }
}

/**
 * POST /api/sessions/:id/students
 */
export async function addStudentToSessionHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const { studentId } = req.body;

    const session = await storage.findById<Session>('sessions.json', id);
    if (!session) {
      return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
    }

    if (session.tutorId !== currentUser.userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể thêm học sinh'));
    }

    // Check if student exists
    const student = await storage.findById<User>('users.json', studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      return res.status(404).json(errorResponse('Không tìm thấy học sinh'));
    }

    // Check if already added
    if (session.studentIds.includes(studentId)) {
      return res.status(400).json(errorResponse('Học sinh đã có trong buổi học'));
    }

    // Add student
    const updatedSession = await storage.update<Session>('sessions.json', id, {
      studentIds: [...session.studentIds, studentId],
      updatedAt: now()
    });

    return res.json(successResponse(updatedSession, 'Thêm học sinh thành công'));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi thêm học sinh: ' + error.message));
  }
}

/**
 * DELETE /api/sessions/:id/students/:studentId
 */
export async function removeStudentFromSessionHandler(req: AuthRequest, res: Response) {
  try {
    const { id, studentId } = req.params;
    const currentUser = req.user!;

    const session = await storage.findById<Session>('sessions.json', id);
    if (!session) {
      return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
    }

    if (session.tutorId !== currentUser.userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể xóa học sinh'));
    }

    // Check if student is in the session
    if (!session.studentIds.includes(studentId)) {
      return res.status(404).json(errorResponse('Học sinh không có trong buổi học'));
    }

    // Remove student
    const updatedSession = await storage.update<Session>('sessions.json', id, {
      studentIds: session.studentIds.filter(sid => sid !== studentId),
      updatedAt: now()
    });

    return res.json(successResponse(updatedSession, 'Xóa học sinh thành công'));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi xóa học sinh: ' + error.message));
  }
}

