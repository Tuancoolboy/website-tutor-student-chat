/**
 * Submissions API for grading
 * GET /api/sessions/:id/submissions - Get all submissions (tutor sees all, student sees own)
 * PUT /api/sessions/:id/submissions/:submissionId/grade - Grade a submission (tutor only)
 */

import { Response } from 'express';
import { storage } from '../../../lib/storage.js';
import { Session, AssignmentSubmission, Grade, Assignment, UserRole } from '../../../lib/types.js';
import { AuthRequest } from '../../../lib/middleware.js';
import { successResponse, errorResponse, now, generateId } from '../../../lib/utils.js';

/**
 * GET /api/sessions/:id/submissions
 */
export async function getSubmissionsHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const session = await storage.findById<Session>('sessions.json', id);
    if (!session) {
      return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
    }

    if (
      currentUser.role !== UserRole.MANAGEMENT &&
      !session.studentIds.includes(currentUser.userId) &&
      session.tutorId !== currentUser.userId
    ) {
      return res.status(403).json(errorResponse('Bạn không có quyền xem bài nộp'));
    }

    // Get all assignments for this session
    const allAssignments = await storage.read<Assignment>('assignments.json');
    const sessionAssignments = allAssignments.filter(a => a.sessionId === id);
    const assignmentIds = sessionAssignments.map(a => a.id);

    // Get all submissions
    const allSubmissions = await storage.read<AssignmentSubmission>('assignment-submissions.json');
    let sessionSubmissions = allSubmissions.filter(s => assignmentIds.includes(s.assignmentId));

    // If student, only show their own submissions
    if (currentUser.role === UserRole.STUDENT) {
      sessionSubmissions = sessionSubmissions.filter(s => s.studentId === currentUser.userId);
    }

    return res.json(successResponse(sessionSubmissions));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi lấy danh sách bài nộp: ' + error.message));
  }
}

/**
 * PUT /api/sessions/:id/submissions/:submissionId/grade
 */
export async function gradeSubmissionHandler(req: AuthRequest, res: Response) {
  try {
    const { id, submissionId } = req.params;
    const currentUser = req.user!;
    const { score, feedback } = req.body;

    const session = await storage.findById<Session>('sessions.json', id);
    if (!session) {
      return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
    }

    if (session.tutorId !== currentUser.userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể chấm điểm'));
    }

    const submission = await storage.findById<AssignmentSubmission>('assignment-submissions.json', submissionId);
    if (!submission) {
      return res.status(404).json(errorResponse('Không tìm thấy bài nộp'));
    }

    const assignment = await storage.findById<Assignment>('assignments.json', submission.assignmentId);
    if (!assignment || assignment.sessionId !== id) {
      return res.status(404).json(errorResponse('Bài tập không thuộc buổi học này'));
    }

    // Update submission with grade
    const updatedSubmission = await storage.update<AssignmentSubmission>(
      'assignment-submissions.json',
      submissionId,
      {
        score,
        feedback,
        gradedBy: currentUser.userId,
        gradedAt: now(),
        status: 'graded'
      }
    );

    // Create or update grade entry
    const allGrades = await storage.read<Grade>('grades.json');
    const existingGrade = allGrades.find(
      g => g.sessionId === id && 
           g.studentId === submission.studentId && 
           g.itemId === assignment.id &&
           g.itemType === 'assignment'
    );

    const gradeData: Grade = {
      id: existingGrade?.id || generateId('grade'),
      sessionId: id,
      studentId: submission.studentId,
      itemType: 'assignment',
      itemId: assignment.id,
      itemTitle: assignment.title,
      score,
      maxScore: assignment.totalPoints,
      percentage: (score / assignment.totalPoints) * 100,
      feedback,
      gradedBy: currentUser.userId,
      gradedAt: now()
    };

    if (existingGrade) {
      await storage.update('grades.json', existingGrade.id, gradeData);
    } else {
      await storage.create('grades.json', gradeData);
    }

    return res.json(successResponse({ submission: updatedSubmission, grade: gradeData }, 'Chấm điểm thành công'));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi chấm điểm: ' + error.message));
  }
}

