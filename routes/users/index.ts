/**
 * GET /api/users
 * List users with filters and pagination
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { User, UserRole } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { errorResponse } from '../../lib/utils.js';

export async function listUsersHandler(req: AuthRequest, res: Response) {
  try {
    const { role, search, page = '1', limit = '10' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Build filter function
    const filter = (user: User) => {
      // Filter by role if specified
      if (role && user.role !== role) {
        return false;
      }

      // Search in name or email
      if (search) {
        const searchLower = (search as string).toLowerCase();
        return (
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
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

    // Remove passwords from all users
    result.data = result.data.map(({ password, ...user }) => user);

    return res.json(result);
  } catch (error: any) {
    console.error('List users error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy danh sách người dùng: ' + error.message)
    );
  }
}

