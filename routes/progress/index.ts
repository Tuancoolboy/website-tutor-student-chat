/**
 * Progress APIs
 * GET /api/progress - List progress records
 * POST /api/progress - Create progress record (tutors only)
 * GET /api/progress/:id - Get specific progress record
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { ProgressEntry, UserRole, Session } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../lib/utils.js';

/**
 * GET /api/progress
 */
export async function listProgressHandler(req: AuthRequest, res: Response) {
  try {
    const {
      studentId,
      tutorId,
      subject,
      sessionId,
      page = '1',
      limit = '100'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const currentUser = req.user!;

    // Build filter
    const filter = (progress: ProgressEntry) => {
      // Authorization: users can only see their own progress unless management
      if (currentUser.role === UserRole.STUDENT) {
        if (progress.studentId !== currentUser.userId) {
          return false;
        }
      } else if (currentUser.role === UserRole.TUTOR) {
        if (progress.tutorId !== currentUser.userId) {
          return false;
        }
      }
      // Management can see all

      // Filter by studentId
      if (studentId && progress.studentId !== studentId) return false;

      // Filter by tutorId
      if (tutorId && progress.tutorId !== tutorId) return false;

      // Filter by subject
      if (subject && progress.subject !== subject) return false;

      // Filter by sessionId
      if (sessionId && progress.sessionId !== sessionId) return false;

      return true;
    };

    const result = await storage.paginate<ProgressEntry>(
      'progress.json',
      pageNum,
      limitNum,
      filter
    );

    return res.json(result);
  } catch (error: any) {
    console.error('List progress error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách tiến độ: ' + error.message)
    );
  }
}

/**
 * POST /api/progress
 */
export async function createProgressHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const progressData = req.body;

    // Only tutors can create progress records
    if (currentUser.role !== UserRole.TUTOR) {
      return res.status(403).json(
        errorResponse('Chỉ gia sư mới có thể tạo báo cáo tiến độ')
      );
    }

    // Verify the progress is for this tutor's sessions
    const session = await storage.findById<Session>('sessions.json', progressData.sessionId);
    if (!session || session.tutorId !== currentUser.userId) {
      return res.status(403).json(
        errorResponse('Bạn chỉ có thể tạo báo cáo cho buổi học của mình')
      );
    }

    // Check if progress already exists for this session
    const existing = await storage.find<ProgressEntry>(
      'progress.json',
      (p) => p.sessionId === progressData.sessionId
    );

    if (existing.length > 0) {
      return res.status(400).json(
        errorResponse('Báo cáo tiến độ cho buổi học này đã tồn tại')
      );
    }

    const newProgress: ProgressEntry = {
      id: generateId('prog'),
      studentId: progressData.studentId,
      tutorId: currentUser.userId,
      sessionId: progressData.sessionId,
      subject: progressData.subject,
      topic: progressData.topic,
      notes: progressData.notes || '',
      score: progressData.score,
      improvements: progressData.improvements || [],
      challenges: progressData.challenges || [],
      nextSteps: progressData.nextSteps || [],
      createdAt: now()
    };

    await storage.create('progress.json', newProgress);

    return res.json(
      successResponse(newProgress, 'Tạo báo cáo tiến độ thành công')
    );
  } catch (error: any) {
    console.error('Create progress error:', error);
    return res.status(500).json(
      errorResponse('Lỗi tạo báo cáo tiến độ: ' + error.message)
    );
  }
}

/**
 * GET /api/progress/:id
 */
export async function getProgressHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const progress = await storage.findById<ProgressEntry>('progress.json', id);

    if (!progress) {
      return res.status(404).json(
        errorResponse('Không tìm thấy báo cáo tiến độ')
      );
    }

    // Authorization: only student, tutor, or management can view
    if (
      currentUser.role !== UserRole.MANAGEMENT &&
      progress.studentId !== currentUser.userId &&
      progress.tutorId !== currentUser.userId
    ) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền xem báo cáo tiến độ này')
      );
    }

    return res.json(successResponse(progress));
  } catch (error: any) {
    console.error('Get progress error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy báo cáo tiến độ: ' + error.message)
    );
  }
}

