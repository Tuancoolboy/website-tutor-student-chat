/**
 * Class Detail APIs
 * GET /api/classes/:id - Get class details
 * PUT /api/classes/:id - Update class
 * DELETE /api/classes/:id - Delete/deactivate class
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { Class, ClassStatus, Enrollment, UserRole, User } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, now } from '../../lib/utils.js';

/**
 * GET /api/classes/:id
 */
export async function getClassHandler(req: any, res: Response) {
  try {
    const { id } = req.params;

    const classItem = await storage.findById<Class>('classes.json', id);
    if (!classItem) {
      return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
    }

    // Get enrollments and tutor info in parallel
    const [enrollments, tutor] = await Promise.all([
      storage.find<Enrollment>(
        'enrollments.json',
        (e) => e.classId === id && e.status === 'active'
      ),
      storage.findById<User>('users.json', classItem.tutorId)
    ]);

    return res.json(
      successResponse({
        ...classItem,
        enrollments: enrollments,
        tutor: tutor ? {
          id: tutor.id,
          name: tutor.name,
          email: tutor.email,
          avatar: tutor.avatar
        } : null
      })
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy thông tin lớp học: ' + error.message)
    );
  }
}

/**
 * PUT /api/classes/:id
 */
export async function updateClassHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const currentUser = req.user!;

    const classItem = await storage.findById<Class>('classes.json', id);
    if (!classItem) {
      return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
    }

    // Authorization: only the tutor can update their own class
    if (classItem.tutorId !== currentUser.userId) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền cập nhật lớp học này')
      );
    }

    // If updating maxStudents, validate with current enrollment
    if (updates.maxStudents !== undefined && updates.maxStudents < classItem.currentEnrollment) {
      return res.status(400).json(
        errorResponse(`Không thể giảm số lượng sinh viên tối đa xuống dưới ${classItem.currentEnrollment} (số sinh viên hiện tại)`)
      );
    }

    // Update status to FULL if needed
    if (updates.maxStudents !== undefined || updates.currentEnrollment !== undefined) {
      const newMax = updates.maxStudents ?? classItem.maxStudents;
      const newCurrent = updates.currentEnrollment ?? classItem.currentEnrollment;
      if (newCurrent >= newMax) {
        updates.status = ClassStatus.FULL;
      } else if (classItem.status === ClassStatus.FULL) {
        updates.status = ClassStatus.ACTIVE;
      }
    }

    const updated = await storage.update<Class>(
      'classes.json',
      id,
      { ...updates, updatedAt: now() }
    );

    return res.json(successResponse(updated, 'Cập nhật lớp học thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi cập nhật lớp học: ' + error.message)
    );
  }
}

/**
 * DELETE /api/classes/:id
 */
export async function deleteClassHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const classItem = await storage.findById<Class>('classes.json', id);
    if (!classItem) {
      return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
    }

    // Authorization: only the tutor or management can delete
    if (classItem.tutorId !== currentUser.userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền xóa lớp học này')
      );
    }

    // Check if there are active enrollments
    const activeEnrollments = await storage.find<Enrollment>(
      'enrollments.json',
      (e) => e.classId === id && e.status === 'active'
    );

    if (activeEnrollments.length > 0) {
      // Deactivate instead of delete
      await storage.update<Class>('classes.json', id, {
        status: ClassStatus.INACTIVE,
        updatedAt: now()
      });

      return res.json(
        successResponse(
          null,
          `Lớp học đã được vô hiệu hóa (có ${activeEnrollments.length} sinh viên đang đăng ký)`
        )
      );
    }

    // Delete if no active enrollments
    await storage.delete('classes.json', id);

    return res.json(successResponse(null, 'Xóa lớp học thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi xóa lớp học: ' + error.message)
    );
  }
}

