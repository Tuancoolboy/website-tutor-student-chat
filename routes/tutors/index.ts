/**
 * GET /api/tutors
 * List all tutors with filters
 */

import { Request, Response } from 'express';
import { storage } from '../../lib/storage.js';
import { User, UserRole, Tutor } from '../../lib/types.js';
import { errorResponse } from '../../lib/utils.js';

export async function listTutorsHandler(req: Request, res: Response) {
  try {
    const {
      subject,
      minRating,
      verified,
      search,
      page = '1',
      limit = '10'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const minRatingNum = minRating ? parseFloat(minRating as string) : 0;

    // Filter function
    const filter = (user: User) => {
      // Must be a tutor
      if (user.role !== UserRole.TUTOR) {
        return false;
      }

      const tutor = user as Tutor;

      // Filter by subject
      if (subject && !tutor.subjects.includes(subject as string)) {
        return false;
      }

      // Filter by rating
      if (minRating && tutor.rating < minRatingNum) {
        return false;
      }

      // Filter by verification status
      if (verified !== undefined) {
        const isVerified = verified === 'true';
        if (tutor.verified !== isVerified) {
          return false;
        }
      }

      // Search by name or email
      if (search) {
        const searchLower = (search as string).toLowerCase();
        return (
          tutor.name.toLowerCase().includes(searchLower) ||
          tutor.email.toLowerCase().includes(searchLower) ||
          tutor.subjects.some(s => s.toLowerCase().includes(searchLower))
        );
      }

      return true;
    };

    // Get paginated results
    const result = await storage.paginate<User>(
      'users.json',
      pageNum,
      limitNum,
      filter
    );

    // Remove passwords
    result.data = result.data.map(({ password, ...tutor }) => tutor);

    return res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('List tutors error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách gia sư: ' + error.message)
    );
  }
}

