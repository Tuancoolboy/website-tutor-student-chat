/**
 * Classes APIs
 * GET /api/classes - List classes
 * POST /api/classes - Create new class
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { Class, ClassStatus, UserRole, Availability } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../lib/utils.js';

/**
 * GET /api/classes
 */
export async function listClassesHandler(req: any, res: Response) {
  try {
    const {
      tutorId,
      subject,
      day,
      status,
      availableOnly,
      page = '1',
      limit = '10'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Build filter
    const filter = (classItem: Class) => {
      if (tutorId && classItem.tutorId !== tutorId) return false;
      if (subject && classItem.subject !== subject) return false;
      if (day && classItem.day !== day) return false;
      if (status && classItem.status !== status) return false;
      if (availableOnly === 'true' && classItem.currentEnrollment >= classItem.maxStudents) return false;

      return true;
    };

    const result = await storage.paginate<Class>(
      'classes.json',
      pageNum,
      limitNum,
      filter
    );

    // Return with success wrapper and pagination info
    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('List classes error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách lớp học: ' + error.message)
    );
  }
}

/**
 * POST /api/classes
 */
export async function createClassHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const classData = req.body;

    // Only tutors can create classes
    if (currentUser.role !== UserRole.TUTOR) {
      return res.status(403).json(
        errorResponse('Chỉ gia sư mới có thể tạo lớp học')
      );
    }

    // Validate time slot is within tutor's availability
    const availabilities = await storage.find<Availability>(
      'availability.json',
      (a) => a.tutorId === currentUser.userId
    );

    if (availabilities.length > 0) {
      const availability = availabilities[0];
      const matchingSlot = availability.timeSlots.find(
        (slot) => slot.day === classData.day
      );

      if (!matchingSlot) {
        return res.status(400).json(
          errorResponse(`Bạn không có lịch rảnh vào ${classData.day}`)
        );
      }

      // Check if class time is within availability time
      const classStart = classData.startTime;
      const classEnd = classData.endTime;
      const availStart = matchingSlot.startTime;
      const availEnd = matchingSlot.endTime;

      if (classStart < availStart || classEnd > availEnd) {
        return res.status(400).json(
          errorResponse(`Thời gian lớp học phải nằm trong khoảng ${availStart} - ${availEnd}`)
        );
      }
    }

    // Check for overlapping classes
    const existingClasses = await storage.find<Class>(
      'classes.json',
      (c) => c.tutorId === currentUser.userId && c.day === classData.day && c.status !== ClassStatus.INACTIVE
    );

    for (const existingClass of existingClasses) {
      const existingStart = existingClass.startTime;
      const existingEnd = existingClass.endTime;
      const newStart = classData.startTime;
      const newEnd = classData.endTime;

      // Check for overlap
      if (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        return res.status(400).json(
          errorResponse(`Lớp học bị trùng với lớp ${existingClass.code} (${existingStart} - ${existingEnd})`)
        );
      }
    }

    // Auto-generate class code if not provided
    let classCode = classData.code;
    if (!classCode) {
      const tutorClasses = await storage.find<Class>(
        'classes.json',
        (c) => c.tutorId === currentUser.userId
      );
      classCode = `C${String(tutorClasses.length + 1).padStart(2, '0')}`;
    }

    // Validate semester dates
    const semesterStart = new Date(classData.semesterStart);
    const semesterEnd = new Date(classData.semesterEnd);
    if (semesterEnd <= semesterStart) {
      return res.status(400).json(
        errorResponse('Ngày kết thúc học kỳ phải sau ngày bắt đầu')
      );
    }

    // Create new class
    const newClass: Class = {
      id: generateId('class'),
      code: classCode,
      tutorId: currentUser.userId,
      subject: classData.subject,
      description: classData.description,
      day: classData.day,
      startTime: classData.startTime,
      endTime: classData.endTime,
      duration: classData.duration,
      maxStudents: classData.maxStudents,
      currentEnrollment: 0,
      status: ClassStatus.ACTIVE,
      semesterStart: classData.semesterStart,
      semesterEnd: classData.semesterEnd,
      isOnline: classData.isOnline ?? true,
      location: classData.location,
      createdAt: now(),
      updatedAt: now()
    };

    await storage.create('classes.json', newClass);

    return res.status(201).json(
      successResponse(newClass, 'Tạo lớp học thành công')
    );
  } catch (error: any) {
    console.error('Create class error:', error);
    return res.status(500).json(
      errorResponse('Lỗi tạo lớp học: ' + error.message)
    );
  }
}

