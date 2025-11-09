/**
 * GET /api/calendar/:userId
 * Get user's calendar view with sessions
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { Session, UserRole } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse } from '../../lib/utils.js';

export async function getCalendarHandler(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;
    const { startDate, endDate, month, year } = req.query;
    const currentUser = req.user!;

    // Authorization: users can only view their own calendar unless management
    if (currentUser.userId !== userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền xem lịch này')
      );
    }

    // Verify user exists
    const user = await storage.findById('users.json', userId);
    if (!user) {
      return res.status(404).json(errorResponse('Không tìm thấy người dùng'));
    }

    // Build date range
    let start: Date, end: Date;
    
    if (month && year) {
      // Month view
      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);
      start = new Date(yearNum, monthNum - 1, 1);
      end = new Date(yearNum, monthNum, 0, 23, 59, 59);
    } else if (startDate && endDate) {
      // Custom range
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      // Default: current month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Get sessions in date range
    const sessions = await storage.find<Session>('sessions.json', (session) => {
      // Must belong to user
      const belongsToUser = session.studentIds?.includes(userId) || session.tutorId === userId;
      if (!belongsToUser) return false;

      // Must be in date range
      const sessionDate = new Date(session.startTime);
      return sessionDate >= start && sessionDate <= end;
    });

    // Group by date
    const calendar: Record<string, Session[]> = {};
    sessions.forEach((session) => {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      if (!calendar[date]) {
        calendar[date] = [];
      }
      calendar[date].push(session);
    });

    // Statistics
    const stats = {
      totalSessions: sessions.length,
      byStatus: {} as Record<string, number>,
      totalHours: sessions.reduce((sum, s) => sum + s.duration / 60, 0)
    };

    sessions.forEach((session) => {
      stats.byStatus[session.status] = (stats.byStatus[session.status] || 0) + 1;
    });

    return res.json(
      successResponse({
        calendar,
        sessions,
        stats,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      })
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy lịch: ' + error.message)
    );
  }
}

