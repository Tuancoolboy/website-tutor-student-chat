/**
 * Notifications APIs
 * GET /api/notifications - Get user notifications
 * PUT /api/notifications/:id/read - Mark as read
 * DELETE /api/notifications/:id - Delete notification
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { Notification } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, now } from '../../lib/utils.js';

/**
 * GET /api/notifications
 */
export async function getNotificationsHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const { unreadOnly, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Read notifications once and use for both pagination and unread count
    const allNotifications = await storage.find<Notification>(
      'notifications.json',
      (n) => n.userId === currentUser.userId
    );

    // Filter for unread if needed
    const filteredNotifications = unreadOnly === 'true' 
      ? allNotifications.filter(n => !n.read)
      : allNotifications;

    // Manual pagination
    const total = filteredNotifications.length;
    const totalPages = Math.ceil(total / limitNum);
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginatedData = filteredNotifications.slice(start, end);

    const result = {
      data: paginatedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };

    // Count unread from all notifications (not just filtered)
    const unreadCount = allNotifications.filter(n => !n.read).length;

    return res.json(
      successResponse({
        ...result,
        unreadCount
      })
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy thông báo: ' + error.message)
    );
  }
}

/**
 * PUT /api/notifications/:id/read
 */
export async function markAsReadHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const notification = await storage.findById<Notification>('notifications.json', id);
    if (!notification) {
      return res.status(404).json(errorResponse('Không tìm thấy thông báo'));
    }

    // Authorization
    if (notification.userId !== currentUser.userId) {
      return res.status(403).json(errorResponse('Bạn không có quyền'));
    }

    await storage.update<Notification>('notifications.json', id, { read: true });

    return res.json(successResponse(null, 'Đã đánh dấu đã đọc'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi cập nhật thông báo: ' + error.message)
    );
  }
}

/**
 * DELETE /api/notifications/:id
 */
export async function deleteNotificationHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const notification = await storage.findById<Notification>('notifications.json', id);
    if (!notification) {
      return res.status(404).json(errorResponse('Không tìm thấy thông báo'));
    }

    if (notification.userId !== currentUser.userId) {
      return res.status(403).json(errorResponse('Bạn không có quyền'));
    }

    await storage.delete('notifications.json', id);

    return res.json(successResponse(null, 'Đã xóa thông báo'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi xóa thông báo: ' + error.message)
    );
  }
}

