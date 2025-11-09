/**
 * Enrollment Detail APIs
 * GET /api/enrollments/:id - Get enrollment details
 * PUT /api/enrollments/:id - Update enrollment
 * DELETE /api/enrollments/:id - Cancel enrollment
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { Enrollment, EnrollmentStatus, Class, ClassStatus, UserRole, User } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, now } from '../../lib/utils.js';

/**
 * GET /api/enrollments/:id
 */
export async function getEnrollmentHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const enrollment = await storage.findById<Enrollment>('enrollments.json', id);
    if (!enrollment) {
      return res.status(404).json(errorResponse('Không tìm thấy đăng ký'));
    }

    // Authorization
    if (
      currentUser.role === UserRole.STUDENT &&
      enrollment.studentId !== currentUser.userId
    ) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền xem đăng ký này')
      );
    }

    // Get class and student info - load in parallel
    const [classItem, student] = await Promise.all([
      storage.findById<Class>('classes.json', enrollment.classId),
      storage.findById<User>('users.json', enrollment.studentId)
    ]);

    return res.json(
      successResponse({
        ...enrollment,
        class: classItem,
        student: student ? {
          id: student.id,
          name: student.name,
          email: student.email,
          avatar: student.avatar
        } : null
      })
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy thông tin đăng ký: ' + error.message)
    );
  }
}

/**
 * PUT /api/enrollments/:id
 */
export async function updateEnrollmentHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const currentUser = req.user!;

    const enrollment = await storage.findById<Enrollment>('enrollments.json', id);
    if (!enrollment) {
      return res.status(404).json(errorResponse('Không tìm thấy đăng ký'));
    }

    // Authorization: only the student can update their own enrollment
    if (enrollment.studentId !== currentUser.userId) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền cập nhật đăng ký này')
      );
    }

    // If dropping or cancelling, update class enrollment count
    if (
      updates.status &&
      (updates.status === EnrollmentStatus.DROPPED || updates.status === EnrollmentStatus.CANCELLED) &&
      enrollment.status === EnrollmentStatus.ACTIVE
    ) {
      const classItem = await storage.findById<Class>('classes.json', enrollment.classId);
      if (classItem) {
        await storage.update<Class>('classes.json', enrollment.classId, {
          currentEnrollment: Math.max(0, classItem.currentEnrollment - 1),
          status: classItem.currentEnrollment - 1 < classItem.maxStudents ? ClassStatus.ACTIVE : classItem.status,
          updatedAt: now()
        });
      }

      // Add timestamp for dropped/cancelled
      if (updates.status === EnrollmentStatus.DROPPED) {
        updates.droppedAt = now();
      }
    }

    const updated = await storage.update<Enrollment>(
      'enrollments.json',
      id,
      updates
    );

    return res.json(successResponse(updated, 'Cập nhật đăng ký thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi cập nhật đăng ký: ' + error.message)
    );
  }
}

/**
 * DELETE /api/enrollments/:id
 */
export async function deleteEnrollmentHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const enrollment = await storage.findById<Enrollment>('enrollments.json', id);
    if (!enrollment) {
      return res.status(404).json(errorResponse('Không tìm thấy đăng ký'));
    }

    // Authorization: only the student or management can delete
    if (
      enrollment.studentId !== currentUser.userId &&
      currentUser.role !== UserRole.MANAGEMENT
    ) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền xóa đăng ký này')
      );
    }

    // Update class enrollment count if enrollment is active
    if (enrollment.status === EnrollmentStatus.ACTIVE) {
      const classItem = await storage.findById<Class>('classes.json', enrollment.classId);
      if (classItem) {
        await storage.update<Class>('classes.json', enrollment.classId, {
          currentEnrollment: Math.max(0, classItem.currentEnrollment - 1),
          status: classItem.currentEnrollment - 1 < classItem.maxStudents ? ClassStatus.ACTIVE : classItem.status,
          updatedAt: now()
        });
      }
    }

    await storage.delete('enrollments.json', id);

    return res.json(successResponse(null, 'Hủy đăng ký thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi hủy đăng ký: ' + error.message)
    );
  }
}

