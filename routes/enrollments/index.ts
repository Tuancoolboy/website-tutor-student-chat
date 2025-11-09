/**
 * Enrollments APIs
 * GET /api/enrollments - List enrollments
 * POST /api/enrollments - Create new enrollment
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { Enrollment, EnrollmentStatus, Class, ClassStatus, UserRole, Notification, NotificationType, User } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../../lib/utils.js';

/**
 * Helper function to check time conflict between two classes
 */
function hasTimeConflict(
  day1: string,
  start1: string,
  end1: string,
  day2: string,
  start2: string,
  end2: string
): boolean {
  // Different days = no conflict
  if (day1 !== day2) return false;

  // Check time overlap
  return (
    (start1 >= start2 && start1 < end2) ||
    (end1 > start2 && end1 <= end2) ||
    (start1 <= start2 && end1 >= end2)
  );
}

/**
 * GET /api/enrollments
 */
export async function listEnrollmentsHandler(req: AuthRequest, res: Response) {
  try {
    const {
      studentId,
      classId,
      status,
      page = '1',
      limit = '10'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const currentUser = req.user!;

    // Special case: If student is querying by classId only (to see classmates)
    // Check if they are enrolled in that class
    let canViewAllClassEnrollments = false;
    if (currentUser.role === UserRole.STUDENT && classId && !studentId) {
      const allEnrollments = await storage.read<Enrollment>('enrollments.json');
      const studentEnrolledInClass = allEnrollments.some(
        e => e.classId === classId && e.studentId === currentUser.userId && e.status === 'active'
      );
      canViewAllClassEnrollments = studentEnrolledInClass;
    }

    // Build filter
    const filter = (enrollment: Enrollment) => {
      // Authorization: 
      // - Tutors and management can see all
      // - Students can see their own enrollments
      // - Students can see all enrollments in a class they're enrolled in
      if (currentUser.role === UserRole.STUDENT && 
          enrollment.studentId !== currentUser.userId &&
          !canViewAllClassEnrollments) {
        return false;
      }

      if (studentId && enrollment.studentId !== studentId) return false;
      if (classId && enrollment.classId !== classId) return false;
      if (status && enrollment.status !== status) return false;

      return true;
    };

    const result = await storage.paginate<Enrollment>(
      'enrollments.json',
      pageNum,
      limitNum,
      filter
    );

    // Enrich with class and student info - batch load instead of loop
    const classIds = new Set<string>();
    const studentIds = new Set<string>();
    
    result.data.forEach(enrollment => {
      if (enrollment.classId) classIds.add(enrollment.classId);
      if (enrollment.studentId) studentIds.add(enrollment.studentId);
    });

    // Load all data in parallel (only 2 read operations instead of N*2)
    const [classesMap, usersMap] = await Promise.all([
      storage.findByIds<Class>('classes.json', Array.from(classIds)),
      storage.findByIds<User>('users.json', Array.from(studentIds))
    ]);

    // Enrich data (no more async calls)
    const enrichedData = result.data.map(enrollment => {
      const classItem = classesMap.get(enrollment.classId);
      const student = usersMap.get(enrollment.studentId);
      
      return {
        ...enrollment,
        class: classItem ? {
          id: classItem.id,
          code: classItem.code,
          subject: classItem.subject,
          day: classItem.day,
          startTime: classItem.startTime,
          endTime: classItem.endTime
        } : null,
        student: student ? {
          id: student.id,
          name: student.name,
          email: student.email,
          avatar: student.avatar
        } : null
      };
    });

    return res.json({
      success: true,
      data: enrichedData,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('List enrollments error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách đăng ký: ' + error.message)
    );
  }
}

/**
 * POST /api/enrollments
 */
export async function createEnrollmentHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!;
    const { classId } = req.body;

    // Only students can enroll
    if (currentUser.role !== UserRole.STUDENT) {
      return res.status(403).json(
        errorResponse('Chỉ sinh viên mới có thể đăng ký lớp học')
      );
    }

    // Get class details
    const classItem = await storage.findById<Class>('classes.json', classId);
    if (!classItem) {
      return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
    }

    // Check if class is active
    if (classItem.status === ClassStatus.INACTIVE) {
      return res.status(400).json(
        errorResponse('Lớp học này đã bị vô hiệu hóa')
      );
    }

    // Check if class is full
    if (classItem.currentEnrollment >= classItem.maxStudents) {
      return res.status(400).json(
        errorResponse('Lớp học đã đầy')
      );
    }

    // Check if student already enrolled in this class
    const existingEnrollment = await storage.find<Enrollment>(
      'enrollments.json',
      (e) => e.studentId === currentUser.userId && e.classId === classId && e.status === EnrollmentStatus.ACTIVE
    );

    if (existingEnrollment.length > 0) {
      return res.status(400).json(
        errorResponse('Bạn đã đăng ký lớp học này rồi')
      );
    }

    // Check for time conflicts with other enrolled classes - batch load
    const studentEnrollments = await storage.find<Enrollment>(
      'enrollments.json',
      (e) => e.studentId === currentUser.userId && e.status === EnrollmentStatus.ACTIVE
    );

    if (studentEnrollments.length > 0) {
      // Batch load all enrolled classes at once
      const enrolledClassIds = studentEnrollments.map(e => e.classId).filter(Boolean);
      const enrolledClassesMap = await storage.findByIds<Class>('classes.json', enrolledClassIds);

      // Check conflicts
      for (const enrollment of studentEnrollments) {
        const enrolledClass = enrolledClassesMap.get(enrollment.classId);
        if (enrolledClass) {
          if (hasTimeConflict(
            classItem.day,
            classItem.startTime,
            classItem.endTime,
            enrolledClass.day,
            enrolledClass.startTime,
            enrolledClass.endTime
          )) {
            return res.status(400).json(
              errorResponse(`Lớp học bị trùng giờ với lớp ${enrolledClass.code} (${enrolledClass.day} ${enrolledClass.startTime}-${enrolledClass.endTime})`)
            );
          }
        }
      }
    }

    // Create enrollment
    const newEnrollment: Enrollment = {
      id: generateId('enroll'),
      studentId: currentUser.userId,
      classId: classId,
      status: EnrollmentStatus.ACTIVE,
      enrolledAt: now()
    };

    await storage.create('enrollments.json', newEnrollment);

    // Update class enrollment count
    const updatedClass = await storage.update<Class>('classes.json', classId, {
      currentEnrollment: classItem.currentEnrollment + 1,
      status: classItem.currentEnrollment + 1 >= classItem.maxStudents ? ClassStatus.FULL : classItem.status,
      updatedAt: now()
    });

    // Create notification for tutor
    const notification: Notification = {
      id: generateId('notif'),
      userId: classItem.tutorId,
      type: NotificationType.SESSION_BOOKING,
      title: 'Sinh viên đăng ký lớp học',
      message: `${currentUser.email} đã đăng ký lớp ${classItem.code} - ${classItem.subject}`,
      read: false,
      link: `/classes/${classId}`,
      createdAt: now()
    };
    await storage.create('notifications.json', notification);

    // Get enriched enrollment data
    const student = await storage.findById<User>('users.json', currentUser.userId);

    return res.status(201).json(
      successResponse(
        {
          ...newEnrollment,
          class: {
            id: updatedClass?.id,
            code: updatedClass?.code,
            subject: updatedClass?.subject,
            day: updatedClass?.day,
            startTime: updatedClass?.startTime,
            endTime: updatedClass?.endTime,
            currentEnrollment: updatedClass?.currentEnrollment,
            maxStudents: updatedClass?.maxStudents
          },
          student: student ? {
            id: student.id,
            name: student.name,
            email: student.email
          } : null
        },
        'Đăng ký lớp học thành công'
      )
    );
  } catch (error: any) {
    console.error('Create enrollment error:', error);
    return res.status(500).json(
      errorResponse('Lỗi đăng ký lớp học: ' + error.message)
    );
  }
}

