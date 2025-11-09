/**
 * Session Detail APIs
 * GET /api/sessions/:id - Get session detail
 * PUT /api/sessions/:id - Update session
 * DELETE /api/sessions/:id - Cancel session
 * POST /api/sessions/:id/reschedule - Reschedule session
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { Session, SessionStatus, UserRole, Notification, NotificationType } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, now } from '../../lib/utils.js';

/**
 * GET /api/sessions/:id
 */
export async function getSessionHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const session = await storage.findById<Session>('sessions.json', id);

    if (!session) {
      return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
    }

    // Authorization check
    if (
      currentUser.role !== UserRole.MANAGEMENT &&
      !session.studentIds?.includes(currentUser.userId) &&
      session.tutorId !== currentUser.userId
    ) {
      return res.status(403).json(errorResponse('Bạn không có quyền xem buổi học này'));
    }

    return res.json(successResponse(session));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy thông tin buổi học: ' + error.message)
    );
  }
}

/**
 * PUT /api/sessions/:id
 */
export async function updateSessionHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const currentUser = req.user!;

    const session = await storage.findById<Session>('sessions.json', id);
    if (!session) {
      return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
    }

    // Authorization: only tutor can update (e.g., confirm session)
    if (session.tutorId !== currentUser.userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể cập nhật buổi học'));
    }

    // Don't allow changing certain fields
    delete updates.id;
    delete updates.studentId;
    delete updates.tutorId;
    delete updates.createdAt;

    const updatedSession = await storage.update<Session>(
      'sessions.json',
      id,
      { ...updates, updatedAt: now() }
    );

    return res.json(successResponse(updatedSession, 'Cập nhật buổi học thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi cập nhật buổi học: ' + error.message)
    );
  }
}

/**
 * DELETE /api/sessions/:id (Cancel session)
 */
export async function cancelSessionHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const currentUser = req.user!;

    const session = await storage.findById<Session>('sessions.json', id);
    if (!session) {
      return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
    }

    // Both student and tutor can cancel
    if (
      !session.studentIds?.includes(currentUser.userId) &&
      session.tutorId !== currentUser.userId &&
      currentUser.role !== UserRole.MANAGEMENT
    ) {
      return res.status(403).json(errorResponse('Bạn không có quyền hủy buổi học này'));
    }

    // Update session status to cancelled
    await storage.update<Session>('sessions.json', id, {
      status: SessionStatus.CANCELLED,
      cancelledBy: currentUser.userId,
      cancelReason: reason,
      updatedAt: now()
    });

    // Notify all students and tutor (except current user) - batch create
    const notifyUserIds = [...session.studentIds, session.tutorId].filter(
      uid => uid !== currentUser.userId
    );
    
    if (notifyUserIds.length > 0) {
      const notifications: Notification[] = notifyUserIds.map(notifyUserId => ({
        id: require('../../lib/utils.js').generateId('notif'),
        userId: notifyUserId,
        type: NotificationType.SESSION_CANCELLED,
        title: 'Buổi học đã bị hủy',
        message: `Buổi học ${session.subject} đã bị hủy: ${reason}`,
        read: false,
        link: `/sessions/${id}`,
        createdAt: now()
      }));
      await storage.createMany('notifications.json', notifications);
    }

    return res.json(successResponse(null, 'Hủy buổi học thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi hủy buổi học: ' + error.message)
    );
  }
}

/**
 * POST /api/sessions/:id/reschedule
 */
export async function rescheduleSessionHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { startTime, endTime, reason } = req.body;
    const currentUser = req.user!;

    const session = await storage.findById<Session>('sessions.json', id);
    if (!session) {
      return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
    }

    // Both student and tutor can reschedule
    if (
      !session.studentIds?.includes(currentUser.userId) &&
      session.tutorId !== currentUser.userId
    ) {
      return res.status(403).json(errorResponse('Bạn không có quyền đổi lịch buổi học này'));
    }

    // Calculate new duration
    const duration = Math.round(
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)
    );

    // Update session
    const updatedSession = await storage.update<Session>('sessions.json', id, {
      startTime,
      endTime,
      duration,
      status: SessionStatus.RESCHEDULED,
      rescheduledFrom: session.startTime,
      updatedAt: now()
    });

    // Notify all students and tutor (except current user) - batch create
    const notifyUserIds = [...session.studentIds, session.tutorId].filter(
      uid => uid !== currentUser.userId
    );
    
    if (notifyUserIds.length > 0) {
      const notifications: Notification[] = notifyUserIds.map(notifyUserId => ({
        id: require('../../lib/utils.js').generateId('notif'),
        userId: notifyUserId,
        type: NotificationType.SESSION_RESCHEDULED,
        title: 'Buổi học đã được đổi lịch',
        message: `Buổi học ${session.subject} đã được đổi sang ${new Date(startTime).toLocaleString('vi-VN')}`,
        read: false,
        link: `/sessions/${id}`,
        metadata: { reason },
        createdAt: now()
      }));
      await storage.createMany('notifications.json', notifications);
    }

    return res.json(successResponse(updatedSession, 'Đổi lịch buổi học thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi đổi lịch buổi học: ' + error.message)
    );
  }
}

