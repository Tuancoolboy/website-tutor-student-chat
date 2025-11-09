/**
 * Assignments API for a specific session
 * GET /api/sessions/:id/assignments - Get all assignments for a session
 * POST /api/sessions/:id/assignments - Create new assignment (tutor only)
 * PUT /api/sessions/:id/assignments/:assignmentId - Update assignment (tutor only)
 * DELETE /api/sessions/:id/assignments/:assignmentId - Delete assignment (tutor only)
 * POST /api/sessions/:id/assignments/:assignmentId/submit - Submit assignment (student only)
 */

import { Response } from 'express';
import { storage } from '../../../lib/storage.js';
import { Session, Assignment, AssignmentSubmission, UserRole, Class, Enrollment } from '../../../lib/types.js';
import { AuthRequest } from '../../../lib/middleware.js';
import { successResponse, errorResponse, now, generateId } from '../../../lib/utils.js';

/**
 * GET /api/sessions/:id/assignments
 * Supports both sessionId and classId
 */
export async function getAssignmentsHandler(req: AuthRequest, res: Response) {
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
      return res.status(403).json(errorResponse('Bạn không có quyền xem bài tập này'));
    }

    const allAssignments = await storage.read<Assignment>('assignments.json');
    const assignments = allAssignments.filter(a => 
      isClassView ? a.classId === id : a.sessionId === id
    );

    return res.json(successResponse(assignments));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi lấy danh sách bài tập: ' + error.message));
  }
}

/**
 * POST /api/sessions/:id/assignments
 * Supports both sessionId and classId
 */
export async function createAssignmentHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const assignmentData = req.body;

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

    if (!canCreate) {
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể tạo bài tập'));
    }

    const newAssignment: Assignment = {
      id: generateId('assign'),
      sessionId: isClassView ? undefined : id,
      classId: isClassView ? id : undefined,
      title: assignmentData.title,
      description: assignmentData.description,
      instructions: assignmentData.instructions,
      attachments: assignmentData.attachments || [],
      totalPoints: assignmentData.totalPoints,
      dueDate: assignmentData.dueDate,
      createdBy: currentUser.userId,
      createdAt: now(),
      updatedAt: now()
    };

    await storage.create('assignments.json', newAssignment);
    return res.status(201).json(successResponse(newAssignment, 'Tạo bài tập thành công'));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi tạo bài tập: ' + error.message));
  }
}

/**
 * PUT /api/sessions/:id/assignments/:assignmentId
 * Supports both sessionId and classId
 */
export async function updateAssignmentHandler(req: AuthRequest, res: Response) {
  try {
    const { id, assignmentId } = req.params;
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

    const assignment = await storage.findById<Assignment>('assignments.json', assignmentId);
    if (!assignment) {
      return res.status(404).json(errorResponse('Không tìm thấy bài tập'));
    }

    // Validate assignment belongs to this session/class
    const assignmentBelongsToEntity = isClassView ? assignment.classId === id : assignment.sessionId === id;
    if (!assignmentBelongsToEntity) {
      return res.status(404).json(errorResponse('Bài tập không thuộc về buổi học/lớp học này'));
    }

    if (tutorId !== currentUser.userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể cập nhật bài tập'));
    }

    delete updates.id;
    delete updates.sessionId;
    delete updates.classId;
    delete updates.createdBy;
    delete updates.createdAt;

    const updatedAssignment = await storage.update<Assignment>(
      'assignments.json',
      assignmentId,
      { ...updates, updatedAt: now() }
    );

    return res.json(successResponse(updatedAssignment, 'Cập nhật bài tập thành công'));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi cập nhật bài tập: ' + error.message));
  }
}

/**
 * DELETE /api/sessions/:id/assignments/:assignmentId
 * Supports both sessionId and classId
 */
export async function deleteAssignmentHandler(req: AuthRequest, res: Response) {
  try {
    const { id, assignmentId } = req.params;
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

    const assignment = await storage.findById<Assignment>('assignments.json', assignmentId);
    if (!assignment) {
      return res.status(404).json(errorResponse('Không tìm thấy bài tập'));
    }

    // Validate assignment belongs to this session/class
    const assignmentBelongsToEntity = isClassView ? assignment.classId === id : assignment.sessionId === id;
    if (!assignmentBelongsToEntity) {
      return res.status(404).json(errorResponse('Bài tập không thuộc về buổi học/lớp học này'));
    }

    if (tutorId !== currentUser.userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể xóa bài tập'));
    }

    await storage.delete('assignments.json', assignmentId);
    return res.json(successResponse(null, 'Xóa bài tập thành công'));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi xóa bài tập: ' + error.message));
  }
}

/**
 * POST /api/sessions/:id/assignments/:assignmentId/submit
 * Supports both sessionId and classId
 */
export async function submitAssignmentHandler(req: AuthRequest, res: Response) {
  try {
    const { id, assignmentId } = req.params;
    const currentUser = req.user!;
    const { content, attachments } = req.body;

    // Try to find both class and session - prioritize by ID prefix
    const isLikelyClass = id.startsWith('class_');
    let classItem: Class | null = null;
    let session: Session | null = null;

    if (isLikelyClass) {
      // Try class first
      classItem = await storage.findById<Class>('classes.json', id).catch(() => null);
      // If class not found, also try session as fallback
      if (!classItem) {
        session = await storage.findById<Session>('sessions.json', id).catch(() => null);
      }
    } else {
      // Try session first
      session = await storage.findById<Session>('sessions.json', id).catch(() => null);
      // If session not found, also try class as fallback
      if (!session) {
        classItem = await storage.findById<Class>('classes.json', id).catch(() => null);
      }
    }

    const isClassView = !!classItem;
    let canSubmit = false;
    let tutorId: string;

    if (isClassView && classItem) {
      tutorId = classItem.tutorId;

      // Check if student is enrolled
      const enrollments = await storage.read<Enrollment>('enrollments.json');
      const isEnrolled = enrollments.some(
        e => e.classId === id && e.studentId === currentUser.userId && e.status === 'active'
      );
      canSubmit = isEnrolled;
    } else if (session) {
      tutorId = session.tutorId;
      canSubmit = session.studentIds.includes(currentUser.userId);
    } else {
      // Neither class nor session found
      return res.status(404).json(errorResponse('Không tìm thấy buổi học hoặc lớp học'));
    }

    if (!canSubmit) {
      return res.status(403).json(errorResponse('Bạn không có quyền nộp bài tập này'));
    }

    const assignment = await storage.findById<Assignment>('assignments.json', assignmentId);
    if (!assignment) {
      return res.status(404).json(errorResponse('Không tìm thấy bài tập'));
    }

    // Validate assignment belongs to this session/class
    const assignmentBelongsToEntity = isClassView 
      ? assignment.classId === id 
      : assignment.sessionId === id;
    
    if (!assignmentBelongsToEntity) {
      return res.status(404).json(errorResponse('Bài tập không thuộc về buổi học/lớp học này'));
    }

    // Check if late
    const isLate = assignment.dueDate && new Date() > new Date(assignment.dueDate);

    const submission: AssignmentSubmission = {
      id: generateId('asub'),
      assignmentId,
      studentId: currentUser.userId,
      content,
      attachments: attachments || [],
      submittedAt: now(),
      status: isLate ? 'late' : 'submitted'
    };

    await storage.create('assignment-submissions.json', submission);
    return res.status(201).json(successResponse(submission, 'Nộp bài tập thành công'));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi nộp bài tập: ' + error.message));
  }
}

