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
    const { role, search, page = '1', limit = '10', ids } = req.query;
    
    // If ids parameter is provided, use batch loading (much faster)
    if (ids) {
      const idsArray = Array.isArray(ids) 
        ? ids as string[] 
        : (ids as string).split(',').map(id => id.trim()).filter(Boolean);
      
      if (idsArray.length === 0) {
        return res.json({ success: true, data: [] });
      }
      
      // Use findByIds for efficient batch loading (only reads file once)
      const usersMap = await storage.findByIds<User>('users.json', idsArray);
      
      // Convert Map to array and remove passwords
      const users = Array.from(usersMap.values()).map(({ password, ...user }) => user);
      
      return res.json({ success: true, data: users });
    }
    
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

