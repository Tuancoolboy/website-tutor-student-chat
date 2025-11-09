/**
 * POST /api/auth/logout
 * Logout user
 */

import { Response } from 'express';
import { successResponse } from '../../lib/utils.js';
import { AuthRequest } from '../../lib/middleware.js';

export async function logoutHandler(req: AuthRequest, res: Response) {
  try {
    // In a stateless JWT implementation, logout is handled client-side
    // by removing the token. Server doesn't need to do anything.
    // 
    // If we had a token blacklist or session management,
    // we would invalidate the token here.

    return res.json(
      successResponse(null, 'Đăng xuất thành công')
    );
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Lỗi đăng xuất: ' + error.message
    });
  }
}

