/**
 * Tutor Detail APIs
 * GET /api/tutors/:id - Get tutor by ID
 * GET /api/tutors/:id/reviews - Get tutor reviews
 */

import { Request, Response } from 'express';
import { storage } from '../../lib/storage.js';
import { User, UserRole, Tutor, Evaluation } from '../../lib/types.js';
import { successResponse, errorResponse } from '../../lib/utils.js';

/**
 * GET /api/tutors/:id
 */
export async function getTutorHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await storage.findById<User>('users.json', id);

    if (!user || user.role !== UserRole.TUTOR) {
      return res.status(404).json(
        errorResponse('Không tìm thấy gia sư')
      );
    }

    // Remove password
    const { password, ...tutorWithoutPassword } = user;

    return res.json(successResponse(tutorWithoutPassword));
  } catch (error: any) {
    console.error('Get tutor error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy thông tin gia sư: ' + error.message)
    );
  }
}

/**
 * GET /api/tutors/:id/reviews
 */
export async function getTutorReviewsHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Check if tutor exists
    const tutor = await storage.findById<User>('users.json', id);
    if (!tutor || tutor.role !== UserRole.TUTOR) {
      return res.status(404).json(
        errorResponse('Không tìm thấy gia sư')
      );
    }

    // Get evaluations for this tutor
    const result = await storage.paginate<Evaluation>(
      'evaluations.json',
      pageNum,
      limitNum,
      (evaluation) => evaluation.tutorId === id
    );

    // Calculate statistics
    const stats = {
      totalReviews: result.pagination.total,
      averageRating: 0,
      ratingDistribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      }
    };

    if (result.pagination.total > 0) {
      // Get all evaluations for stats (not just current page)
      const allEvaluations = await storage.find<Evaluation>(
        'evaluations.json',
        (e) => e.tutorId === id
      );

      stats.averageRating =
        allEvaluations.reduce((sum, e) => sum + e.rating, 0) /
        allEvaluations.length;

      // Count rating distribution
      allEvaluations.forEach((e) => {
        stats.ratingDistribution[e.rating as keyof typeof stats.ratingDistribution]++;
      });
    }

    return res.json(
      successResponse({
        reviews: result.data,
        pagination: result.pagination,
        stats
      })
    );
  } catch (error: any) {
    console.error('Get tutor reviews error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy đánh giá gia sư: ' + error.message)
    );
  }
}

