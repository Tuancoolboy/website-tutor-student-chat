/**
 * Student APIs
 * GET /api/students/:id - Get student by ID
 * GET /api/students/:id/sessions - Get student sessions
 */

import { Request, Response } from 'express';
import { storage } from '../../lib/storage.js';
import { User, UserRole, Student, Session } from '../../lib/types.js';
import { successResponse, errorResponse } from '../../lib/utils.js';

/**
 * GET /api/students/:id
 */
export async function getStudentHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await storage.findById<User>('users.json', id);

    if (!user || user.role !== UserRole.STUDENT) {
      return res.status(404).json(
        errorResponse('Không tìm thấy sinh viên')
      );
    }

    // Remove password
    const { password, ...studentWithoutPassword } = user;

    return res.json(successResponse(studentWithoutPassword));
  } catch (error: any) {
    console.error('Get student error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy thông tin sinh viên: ' + error.message)
    );
  }
}

/**
 * GET /api/students/:id/sessions
 */
export async function getStudentSessionsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Check if student exists
    const student = await storage.findById<User>('users.json', id);
    if (!student || student.role !== UserRole.STUDENT) {
      return res.status(404).json(
        errorResponse('Không tìm thấy sinh viên')
      );
    }

    // Build filter
    const filter = (session: Session) => {
      if (!session.studentIds?.includes(id)) {
        return false;
      }

      if (status && session.status !== status) {
        return false;
      }

      return true;
    };

    // Get paginated sessions
    const result = await storage.paginate<Session>(
      'sessions.json',
      pageNum,
      limitNum,
      filter
    );

    // Calculate statistics
    const stats = {
      total: result.pagination.total,
      byStatus: {} as Record<string, number>,
      totalHours: 0
    };

    if (result.pagination.total > 0) {
      // Get all sessions for stats
      const allSessions = await storage.find<Session>(
        'sessions.json',
        (s) => s.studentId === id
      );

      // Count by status
      allSessions.forEach((session) => {
        stats.byStatus[session.status] = (stats.byStatus[session.status] || 0) + 1;
        stats.totalHours += session.duration / 60;
      });
    }

    return res.json(
      successResponse({
        sessions: result.data,
        pagination: result.pagination,
        stats
      })
    );
  } catch (error: any) {
    console.error('Get student sessions error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách buổi học: ' + error.message)
    );
  }
}

