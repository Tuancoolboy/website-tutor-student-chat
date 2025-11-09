/**
 * POST /api/auth/refresh-token
 * Refresh access token
 */

import { Request, Response } from 'express';
import { 
  verifyToken,
  generateToken,
  generateRefreshToken,
  successResponse,
  errorResponse
} from '../../lib/utils.js';

export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(
        errorResponse('Refresh token bị thiếu')
      );
    }

    // Verify refresh token
    const payload = verifyToken(refreshToken);

    if (!payload) {
      return res.status(401).json(
        errorResponse('Refresh token không hợp lệ hoặc đã hết hạn')
      );
    }

    // Generate new tokens
    const newToken = generateToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      hcmutId: payload.hcmutId
    });

    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      hcmutId: payload.hcmutId
    });

    return res.json(
      successResponse({
        token: newToken,
        refreshToken: newRefreshToken
      }, 'Token đã được làm mới')
    );
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return res.status(500).json(
      errorResponse('Lỗi làm mới token: ' + error.message)
    );
  }
}

