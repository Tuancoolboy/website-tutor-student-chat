/**
 * Course Contents API for a specific session
 * GET /api/sessions/:id/course-contents - Get all course contents for a session
 * POST /api/sessions/:id/course-contents - Create new course content (tutor only)
 * PUT /api/sessions/:id/course-contents/:contentId - Update course content (tutor only)
 * DELETE /api/sessions/:id/course-contents/:contentId - Delete course content (tutor only)
 */

import { Response } from 'express';
import { storage } from '../../../lib/storage.js';
import { Session, CourseContent, UserRole, Class, Enrollment } from '../../../lib/types.js';
import { AuthRequest } from '../../../lib/middleware.js';
import { successResponse, errorResponse, now, generateId } from '../../../lib/utils.js';

/**
 * GET /api/sessions/:id/course-contents
 * Supports both sessionId and classId
 */
export async function getCourseContentsHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    
    const isClassView = id.startsWith('class_');
    let tutorId: string;
    let canAccess = false;

    if (isClassView) {
      // Get class
      const classItem = await storage.findById<Class>('classes.json', id);
      if (!classItem) {
        return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
      }
      tutorId = classItem.tutorId;

      // Authorization: tutor, enrolled students, or management
      if (currentUser.role === UserRole.MANAGEMENT || currentUser.userId === tutorId) {
        canAccess = true;
      } else if (currentUser.role === UserRole.STUDENT) {
        // Check if student is enrolled
        const enrollments = await storage.read<Enrollment>('enrollments.json');
        const isEnrolled = enrollments.some(
          e => e.classId === id && e.studentId === currentUser.userId && e.status === 'active'
        );
        canAccess = isEnrolled;
      }
    } else {
      // Get session
      const session = await storage.findById<Session>('sessions.json', id);
      if (!session) {
        return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
      }
      tutorId = session.tutorId;

      // Authorization check
      canAccess = (
        currentUser.role === UserRole.MANAGEMENT ||
        session.studentIds.includes(currentUser.userId) ||
        session.tutorId === currentUser.userId
      );
    }

    if (!canAccess) {
      return res.status(403).json(errorResponse('Bạn không có quyền xem nội dung khóa học này'));
    }

    // Get all course contents for this session/class
    const allContents = await storage.read<CourseContent>('course-contents.json');
    const contents = allContents.filter(c => 
      isClassView ? c.classId === id : c.sessionId === id
    );

    return res.json(successResponse(contents));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách nội dung khóa học: ' + error.message)
    );
  }
}

/**
 * POST /api/sessions/:id/course-contents
 * Supports both sessionId and classId
 */
export async function createCourseContentHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const contentData = req.body;

    const isClassView = id.startsWith('class_');
    let tutorId: string;
    let canCreate = false;

    if (isClassView) {
      // Get class
      const classItem = await storage.findById<Class>('classes.json', id);
      if (!classItem) {
        return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
      }
      tutorId = classItem.tutorId;
      canCreate = (tutorId === currentUser.userId || currentUser.role === UserRole.MANAGEMENT);
    } else {
      // Get session
      const session = await storage.findById<Session>('sessions.json', id);
      if (!session) {
        return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
      }
      tutorId = session.tutorId;
      canCreate = (session.tutorId === currentUser.userId || currentUser.role === UserRole.MANAGEMENT);
    }

    // Only tutor can create course content
    if (!canCreate) {
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể tạo nội dung khóa học'));
    }

    const newContent: CourseContent = {
      id: generateId('content'),
      sessionId: isClassView ? undefined : id,
      classId: isClassView ? id : undefined,
      type: contentData.type,
      title: contentData.title,
      description: contentData.description,
      content: contentData.content,
      fileUrl: contentData.fileUrl,
      fileName: contentData.fileName,
      fileSize: contentData.fileSize,
      url: contentData.url,
      createdBy: currentUser.userId,
      createdAt: now(),
      updatedAt: now()
    };

    await storage.create('course-contents.json', newContent);
    return res.status(201).json(successResponse(newContent, 'Tạo nội dung khóa học thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi tạo nội dung khóa học: ' + error.message)
    );
  }
}

/**
 * PUT /api/sessions/:id/course-contents/:contentId
 * Supports both sessionId and classId
 */
export async function updateCourseContentHandler(req: AuthRequest, res: Response) {
  try {
    const { id, contentId } = req.params;
    const currentUser = req.user!;
    const updates = req.body;

    const isClassView = id.startsWith('class_');
    let tutorId: string;

    if (isClassView) {
      const classItem = await storage.findById<Class>('classes.json', id);
      if (!classItem) {
        return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
      }
      tutorId = classItem.tutorId;
    } else {
      const session = await storage.findById<Session>('sessions.json', id);
      if (!session) {
        return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
      }
      tutorId = session.tutorId;
    }

    // Get content
    const content = await storage.findById<CourseContent>('course-contents.json', contentId);
    if (!content) {
      return res.status(404).json(errorResponse('Không tìm thấy nội dung'));
    }

    // Validate content belongs to this session/class
    const contentBelongsToEntity = isClassView ? content.classId === id : content.sessionId === id;
    if (!contentBelongsToEntity) {
      return res.status(404).json(errorResponse('Nội dung không thuộc về buổi học/lớp học này'));
    }

    // Only tutor can update
    if (tutorId !== currentUser.userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể cập nhật nội dung khóa học'));
    }

    delete updates.id;
    delete updates.sessionId;
    delete updates.classId;
    delete updates.createdBy;
    delete updates.createdAt;

    const updatedContent = await storage.update<CourseContent>(
      'course-contents.json',
      contentId,
      { ...updates, updatedAt: now() }
    );

    return res.json(successResponse(updatedContent, 'Cập nhật nội dung thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi cập nhật nội dung: ' + error.message)
    );
  }
}

/**
 * DELETE /api/sessions/:id/course-contents/:contentId
 * Supports both sessionId and classId
 */
export async function deleteCourseContentHandler(req: AuthRequest, res: Response) {
  try {
    const { id, contentId } = req.params;
    const currentUser = req.user!;

    const isClassView = id.startsWith('class_');
    let tutorId: string;

    if (isClassView) {
      const classItem = await storage.findById<Class>('classes.json', id);
      if (!classItem) {
        return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
      }
      tutorId = classItem.tutorId;
    } else {
      const session = await storage.findById<Session>('sessions.json', id);
      if (!session) {
        return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
      }
      tutorId = session.tutorId;
    }

    // Get content
    const content = await storage.findById<CourseContent>('course-contents.json', contentId);
    if (!content) {
      return res.status(404).json(errorResponse('Không tìm thấy nội dung'));
    }

    // Validate content belongs to this session/class
    const contentBelongsToEntity = isClassView ? content.classId === id : content.sessionId === id;
    if (!contentBelongsToEntity) {
      return res.status(404).json(errorResponse('Nội dung không thuộc về buổi học/lớp học này'));
    }

    // Only tutor can delete
    if (tutorId !== currentUser.userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể xóa nội dung khóa học'));
    }

    await storage.delete('course-contents.json', contentId);
    return res.json(successResponse(null, 'Xóa nội dung thành công'));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi xóa nội dung: ' + error.message)
    );
  }
}

