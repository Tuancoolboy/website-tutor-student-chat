/**
 * POST /api/auth/login
 * Mock HCMUT_SSO Login
 */

import { Request, Response } from 'express';
import { storage } from '../../lib/storage.js';
import { 
  comparePassword, 
  generateToken, 
  generateRefreshToken,
  successResponse, 
  errorResponse 
} from '../../lib/utils.js';
import { User } from '../../lib/types.js';

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Find user by email
    const users = await storage.find<User>(
      'users.json',
      (user) => user.email === email
    );

    if (users.length === 0) {
      return res.status(401).json(
        errorResponse('Email hoặc mật khẩu không đúng')
      );
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json(
        errorResponse('Email hoặc mật khẩu không đúng')
      );
    }

    // Generate tokens
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      hcmutId: user.hcmutId
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      hcmutId: user.hcmutId
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.json(
      successResponse({
        user: userWithoutPassword,
        token,
        refreshToken
      }, 'Đăng nhập thành công')
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json(
      errorResponse('Lỗi đăng nhập: ' + error.message)
    );
  }
}

