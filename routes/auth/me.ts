/**
 * GET /api/auth/me
 * Get current user info
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { successResponse, errorResponse } from '../../lib/utils.js';
import { User } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';

export async function meHandler(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json(
        errorResponse('Chưa xác thực')
      );
    }

    const user = await storage.findById<User>('users.json', req.user.userId);

    if (!user) {
      return res.status(404).json(
        errorResponse('Không tìm thấy người dùng')
      );
    }

    // Remove password
    const { password, ...userWithoutPassword } = user;

    return res.json(
      successResponse(userWithoutPassword)
    );
  } catch (error: any) {
    console.error('Get me error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy thông tin người dùng: ' + error.message)
    );
  }
}

