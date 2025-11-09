/**
 * Quizzes API for a specific session
 * GET /api/sessions/:id/quizzes - Get all quizzes for a session
 * POST /api/sessions/:id/quizzes - Create new quiz (tutor only)
 * PUT /api/sessions/:id/quizzes/:quizId - Update quiz (tutor only)
 * DELETE /api/sessions/:id/quizzes/:quizId - Delete quiz (tutor only)
 * POST /api/sessions/:id/quizzes/:quizId/submit - Submit quiz (student only)
 */

import { Response } from 'express';
import { storage } from '../../../lib/storage.js';
import { Session, Quiz, QuizSubmission, Grade, UserRole, Class, Enrollment } from '../../../lib/types.js';
import { AuthRequest } from '../../../lib/middleware.js';
import { successResponse, errorResponse, now, generateId } from '../../../lib/utils.js';

/**
 * GET /api/sessions/:id/quizzes
 * Supports both sessionId and classId
 */
export async function getQuizzesHandler(req: AuthRequest, res: Response) {
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
      return res.status(403).json(errorResponse('Bạn không có quyền xem quiz này'));
    }

    const allQuizzes = await storage.read<Quiz>('quizzes.json');
    const quizzes = allQuizzes.filter(q => 
      isClassView ? q.classId === id : q.sessionId === id
    );

    return res.json(successResponse(quizzes));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi lấy danh sách quiz: ' + error.message));
  }
}

/**
 * POST /api/sessions/:id/quizzes
 * Supports both sessionId and classId
 */
export async function createQuizHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    const quizData = req.body;

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
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể tạo quiz'));
    }

    // Calculate total points
    const totalPoints = quizData.questions.reduce((sum: number, q: any) => sum + q.points, 0);

    const newQuiz: Quiz = {
      id: generateId('quiz'),
      sessionId: isClassView ? undefined : id,
      classId: isClassView ? id : undefined,
      title: quizData.title,
      description: quizData.description,
      questions: quizData.questions,
      totalPoints,
      duration: quizData.duration,
      dueDate: quizData.dueDate,
      createdBy: currentUser.userId,
      createdAt: now(),
      updatedAt: now()
    };

    await storage.create('quizzes.json', newQuiz);
    return res.status(201).json(successResponse(newQuiz, 'Tạo quiz thành công'));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi tạo quiz: ' + error.message));
  }
}

/**
 * PUT /api/sessions/:id/quizzes/:quizId
 * Supports both sessionId and classId
 */
export async function updateQuizHandler(req: AuthRequest, res: Response) {
  try {
    const { id, quizId } = req.params;
    const currentUser = req.user!;
    const updates = req.body;

    const isClassView = id.startsWith('class_');
    let tutorId: string;
    let canUpdate = false;

    if (isClassView) {
      // Get class
      const classItem = await storage.findById<Class>('classes.json', id);
      if (!classItem) {
        return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
      }
      tutorId = classItem.tutorId;
    } else {
      // Get session
      const session = await storage.findById<Session>('sessions.json', id);
      if (!session) {
        return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
      }
      tutorId = session.tutorId;
    }

    const quiz = await storage.findById<Quiz>('quizzes.json', quizId);
    if (!quiz) {
      return res.status(404).json(errorResponse('Không tìm thấy quiz'));
    }

    // Validate quiz belongs to this session/class
    const quizBelongsToEntity = isClassView ? quiz.classId === id : quiz.sessionId === id;
    if (!quizBelongsToEntity) {
      return res.status(404).json(errorResponse('Quiz không thuộc về buổi học/lớp học này'));
    }

    canUpdate = (tutorId === currentUser.userId || currentUser.role === UserRole.MANAGEMENT);
    if (!canUpdate) {
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể cập nhật quiz'));
    }

    // Recalculate total points if questions updated
    if (updates.questions) {
      updates.totalPoints = updates.questions.reduce((sum: number, q: any) => sum + q.points, 0);
    }

    delete updates.id;
    delete updates.sessionId;
    delete updates.classId;
    delete updates.createdBy;
    delete updates.createdAt;

    const updatedQuiz = await storage.update<Quiz>(
      'quizzes.json',
      quizId,
      { ...updates, updatedAt: now() }
    );

    return res.json(successResponse(updatedQuiz, 'Cập nhật quiz thành công'));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi cập nhật quiz: ' + error.message));
  }
}

/**
 * DELETE /api/sessions/:id/quizzes/:quizId
 * Supports both sessionId and classId
 */
export async function deleteQuizHandler(req: AuthRequest, res: Response) {
  try {
    const { id, quizId } = req.params;
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

    const quiz = await storage.findById<Quiz>('quizzes.json', quizId);
    if (!quiz) {
      return res.status(404).json(errorResponse('Không tìm thấy quiz'));
    }

    // Validate quiz belongs to this session/class
    const quizBelongsToEntity = isClassView ? quiz.classId === id : quiz.sessionId === id;
    if (!quizBelongsToEntity) {
      return res.status(404).json(errorResponse('Quiz không thuộc về buổi học/lớp học này'));
    }

    if (tutorId !== currentUser.userId && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(errorResponse('Chỉ gia sư mới có thể xóa quiz'));
    }

    await storage.delete('quizzes.json', quizId);
    return res.json(successResponse(null, 'Xóa quiz thành công'));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi xóa quiz: ' + error.message));
  }
}

/**
 * GET /api/sessions/:id/quizzes/:quizId/submissions
 * Get all submissions for a specific quiz
 */
export async function getQuizSubmissionsHandler(req: AuthRequest, res: Response) {
  try {
    const { id, quizId } = req.params;
    const currentUser = req.user!;

    const isClassView = id.startsWith('class_');
    let tutorId: string;
    let canView = false;

    // Verify quiz exists and get tutor
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

    const quiz = await storage.findById<Quiz>('quizzes.json', quizId);
    if (!quiz) {
      return res.status(404).json(errorResponse('Không tìm thấy quiz'));
    }

    // Validate quiz belongs to this session/class
    const quizBelongsToEntity = isClassView ? quiz.classId === id : quiz.sessionId === id;
    if (!quizBelongsToEntity) {
      return res.status(404).json(errorResponse('Quiz không thuộc về buổi học/lớp học này'));
    }

    // Authorization: tutor or management can view all submissions
    if (currentUser.role === UserRole.MANAGEMENT || currentUser.userId === tutorId) {
      canView = true;
    }

    if (!canView) {
      return res.status(403).json(errorResponse('Bạn không có quyền xem submissions'));
    }

    // Get all quiz submissions
    const allQuizSubmissions = await storage.read<QuizSubmission>('quiz-submissions.json');
    const quizSubmissions = allQuizSubmissions.filter(s => s.quizId === quizId);

    return res.json(successResponse(quizSubmissions));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi lấy submissions: ' + error.message));
  }
}

/**
 * POST /api/sessions/:id/quizzes/:quizId/submit
 * Supports both sessionId and classId
 */
export async function submitQuizHandler(req: AuthRequest, res: Response) {
  try {
    const { id, quizId } = req.params;
    const currentUser = req.user!;
    const { answers } = req.body;

    const isClassView = id.startsWith('class_');
    let canSubmit = false;
    let tutorId: string;

    if (isClassView) {
      // Get class
      const classItem = await storage.findById<Class>('classes.json', id);
      if (!classItem) {
        return res.status(404).json(errorResponse('Không tìm thấy lớp học'));
      }
      tutorId = classItem.tutorId;

      // Check if student is enrolled
      const enrollments = await storage.read<Enrollment>('enrollments.json');
      const isEnrolled = enrollments.some(
        e => e.classId === id && e.studentId === currentUser.userId && e.status === 'active'
      );
      canSubmit = isEnrolled;
    } else {
      // Get session
      const session = await storage.findById<Session>('sessions.json', id);
      if (!session) {
        return res.status(404).json(errorResponse('Không tìm thấy buổi học'));
      }
      tutorId = session.tutorId;
      canSubmit = session.studentIds.includes(currentUser.userId);
    }

    if (!canSubmit) {
      return res.status(403).json(errorResponse('Bạn không có quyền nộp quiz này'));
    }

    const quiz = await storage.findById<Quiz>('quizzes.json', quizId);
    if (!quiz) {
      return res.status(404).json(errorResponse('Không tìm thấy quiz'));
    }

    // Validate quiz belongs to this session/class
    const quizBelongsToEntity = isClassView ? quiz.classId === id : quiz.sessionId === id;
    if (!quizBelongsToEntity) {
      return res.status(404).json(errorResponse('Quiz không thuộc về buổi học/lớp học này'));
    }

    // Auto-grade the quiz
    // Convert answers object {q1: "answer1", q2: "answer2"} to array format
    const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer: String(answer)
    }));

    let totalScore = 0;
    const gradedAnswers = [];

    for (const question of quiz.questions) {
      const studentAnswer = answers[question.id];
      const isCorrect = 
        question.type === 'multiple_choice' || question.type === 'true_false'
          ? studentAnswer === question.correctAnswer?.toString()
          : false; // Short answer needs manual grading

      if (isCorrect) {
        totalScore += question.points;
      }

      gradedAnswers.push({
        questionId: question.id,
        answer: studentAnswer || '',
        correct: question.type === 'short_answer' ? undefined : isCorrect,
        points: isCorrect ? question.points : 0
      });
    }

    const submission: QuizSubmission = {
      id: generateId('qsub'),
      quizId,
      studentId: currentUser.userId,
      answers: answerArray,
      score: totalScore,
      gradedBy: tutorId,
      submittedAt: now(),
      gradedAt: now()
    };

    await storage.create('quiz-submissions.json', submission);

    // Create grade entry (only for sessions, not classes)
    // For classes, grades are typically aggregated separately
    if (!isClassView) {
      const grade: Grade = {
        id: generateId('grade'),
        sessionId: id,
        studentId: currentUser.userId,
        itemType: 'quiz',
        itemId: quizId,
        itemTitle: quiz.title,
        score: totalScore,
        maxScore: quiz.totalPoints,
        percentage: (totalScore / quiz.totalPoints) * 100,
        gradedBy: tutorId,
        gradedAt: now()
      };

      await storage.create('grades.json', grade);
    }

    return res.status(201).json(successResponse({ 
      score: totalScore,
      totalPoints: quiz.totalPoints,
      percentage: Math.round((totalScore / quiz.totalPoints) * 100),
      gradedAnswers,
      feedback: totalScore / quiz.totalPoints >= 0.8 
        ? 'Xuất sắc! Bạn đã làm rất tốt!' 
        : totalScore / quiz.totalPoints >= 0.5
        ? 'Tốt! Tiếp tục phát huy.'
        : 'Cần cố gắng thêm. Hãy xem lại các câu sai.'
    }, 'Nộp quiz thành công'));
  } catch (error: any) {
    return res.status(500).json(errorResponse('Lỗi nộp quiz: ' + error.message));
  }
}

