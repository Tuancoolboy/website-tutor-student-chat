import { Request, Response } from 'express'
import { storage } from '../../lib/storage.js'
import { AuthRequest } from '../../lib/middleware.js'
import { successResponse, errorResponse, generateId, now } from '../../lib/utils.js'
import { UserRole, Evaluation, Session } from '../../lib/types.js'

/**
 * GET /api/evaluations
 * List evaluations for the authenticated user
 * Query params:
 *   - studentId: filter by student
 *   - tutorId: filter by tutor
 *   - sessionId: filter by session
 *   - page: page number (default 1)
 *   - limit: items per page (default 20)
 */
export async function listEvaluationsHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!
    const { studentId, tutorId, sessionId, page = '1', limit = '20' } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)

    const filter = (evaluation: Evaluation) => {
      // Management can see all
      if (currentUser.role === UserRole.MANAGEMENT) {
        if (studentId && evaluation.studentId !== studentId) return false
        if (tutorId && evaluation.tutorId !== tutorId) return false
        if (sessionId && evaluation.sessionId !== sessionId) return false
        return true
      }

      // Students can only see their own evaluations
      if (currentUser.role === UserRole.STUDENT) {
        if (evaluation.studentId !== currentUser.userId) return false
        if (sessionId && evaluation.sessionId !== sessionId) return false
        return true
      }

      // Tutors can only see evaluations for their sessions
      if (currentUser.role === UserRole.TUTOR) {
        if (evaluation.tutorId !== currentUser.userId) return false
        if (sessionId && evaluation.sessionId !== sessionId) return false
        return true
      }

      return false
    }

    const result = await storage.paginate<Evaluation>(
      'evaluations.json',
      pageNum,
      limitNum,
      filter
    )

    return res.json(successResponse(result))
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách đánh giá: ' + error.message)
    )
  }
}

/**
 * POST /api/evaluations
 * Create a new evaluation
 * Body: { sessionId, rating, comment, aspects }
 */
export async function createEvaluationHandler(req: AuthRequest, res: Response) {
  try {
    const currentUser = req.user!
    const { sessionId, rating, comment, aspects, improvements, recommend } = req.body

    // Only students can create evaluations
    if (currentUser.role !== UserRole.STUDENT) {
      return res.status(403).json(
        errorResponse('Chỉ sinh viên mới có thể đánh giá buổi học')
      )
    }

    // Validate required fields
    if (!sessionId || !rating) {
      return res.status(400).json(
        errorResponse('Session ID và rating là bắt buộc')
      )
    }

    // Get session to verify it exists and belongs to this student
    const session = await storage.findById<Session>('sessions.json', sessionId)
    if (!session) {
      return res.status(404).json(
        errorResponse('Không tìm thấy buổi học')
      )
    }

    if (!session.studentIds?.includes(currentUser.userId)) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền đánh giá buổi học này')
      )
    }

    // Check if session is completed
    if (session.status !== 'completed') {
      return res.status(400).json(
        errorResponse('Chỉ có thể đánh giá buổi học đã hoàn thành')
      )
    }

    // Check if already evaluated
    const existingEvaluations = await storage.find<Evaluation>(
      'evaluations.json',
      (e) => e.sessionId === sessionId && e.studentId === currentUser.userId
    )

    if (existingEvaluations.length > 0) {
      return res.status(400).json(
        errorResponse('Bạn đã đánh giá buổi học này rồi')
      )
    }

    // Create evaluation
    const newEvaluation: Evaluation = {
      id: generateId('eval'),
      sessionId,
      studentId: currentUser.userId,
      tutorId: session.tutorId,
      rating,
      comment: comment || '',
      aspects: aspects || {},
      improvements: improvements || [],
      recommend: recommend || false,
      createdAt: now()
    }

    await storage.create('evaluations.json', newEvaluation)

    return res.status(201).json(
      successResponse(newEvaluation, 'Đánh giá buổi học thành công')
    )
  } catch (error: any) {
    console.error('Create evaluation error:', error)
    return res.status(500).json(
      errorResponse('Lỗi tạo đánh giá: ' + error.message)
    )
  }
}

/**
 * GET /api/evaluations/:id
 * Get a specific evaluation
 */
export async function getEvaluationHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const currentUser = req.user!

    const evaluation = await storage.findById<Evaluation>('evaluations.json', id)

    if (!evaluation) {
      return res.status(404).json(errorResponse('Không tìm thấy đánh giá'))
    }

    // Authorization check
    if (
      currentUser.role !== UserRole.MANAGEMENT &&
      evaluation.studentId !== currentUser.userId &&
      evaluation.tutorId !== currentUser.userId
    ) {
      return res.status(403).json(errorResponse('Bạn không có quyền xem đánh giá này'))
    }

    return res.json(successResponse(evaluation))
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi lấy thông tin đánh giá: ' + error.message)
    )
  }
}

/**
 * PUT /api/evaluations/:id
 * Update an evaluation
 */
export async function updateEvaluationHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const updates = req.body
    const currentUser = req.user!

    const evaluation = await storage.findById<Evaluation>('evaluations.json', id)
    if (!evaluation) {
      return res.status(404).json(errorResponse('Không tìm thấy đánh giá'))
    }

    // Only the student who created the evaluation can update it
    if (evaluation.studentId !== currentUser.userId) {
      return res.status(403).json(errorResponse('Chỉ người tạo đánh giá mới có thể sửa'))
    }

    // Don't allow changing certain fields
    delete updates.id
    delete updates.sessionId
    delete updates.studentId
    delete updates.tutorId
    delete updates.createdAt

    const updatedEvaluation = await storage.update<Evaluation>(
      'evaluations.json',
      id,
      { ...updates, updatedAt: now() }
    )

    return res.json(successResponse(updatedEvaluation, 'Cập nhật đánh giá thành công'))
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi cập nhật đánh giá: ' + error.message)
    )
  }
}

/**
 * DELETE /api/evaluations/:id
 * Delete an evaluation
 */
export async function deleteEvaluationHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const currentUser = req.user!

    const evaluation = await storage.findById<Evaluation>('evaluations.json', id)
    if (!evaluation) {
      return res.status(404).json(errorResponse('Không tìm thấy đánh giá'))
    }

    // Only the student who created or management can delete
    if (
      currentUser.role !== UserRole.MANAGEMENT &&
      evaluation.studentId !== currentUser.userId
    ) {
      return res.status(403).json(errorResponse('Bạn không có quyền xóa đánh giá này'))
    }

    await storage.delete('evaluations.json', id)

    return res.json(successResponse(null, 'Xóa đánh giá thành công'))
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('Lỗi xóa đánh giá: ' + error.message)
    )
  }
}

