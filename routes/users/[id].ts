/**
 * User Detail APIs
 * GET /api/users/:id - Get user by ID
 * PUT /api/users/:id - Update user
 * DELETE /api/users/:id - Delete user
 */

import { Response } from 'express';
import { storage } from '../../lib/storage.js';
import { User, UserRole } from '../../lib/types.js';
import { AuthRequest } from '../../lib/middleware.js';
import { successResponse, errorResponse, now } from '../../lib/utils.js';

/**
 * GET /api/users/:id
 */
export async function getUserHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await storage.findById<User>('users.json', id);

    if (!user) {
      return res.status(404).json(
        errorResponse('Không tìm thấy người dùng')
      );
    }

    // Remove password
    const { password, ...userWithoutPassword } = user;

    return res.json(successResponse(userWithoutPassword));
  } catch (error: any) {
    console.error('Get user error:', error);
    return res.status(500).json(
      errorResponse('Lỗi lấy thông tin người dùng: ' + error.message)
    );
  }
}

/**
 * PUT /api/users/:id
 */
export async function updateUserHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const currentUser = req.user!;

    // Check authorization: users can only update their own profile,
    // unless they're management
    if (currentUser.userId !== id && currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(
        errorResponse('Bạn không có quyền cập nhật người dùng này')
      );
    }

    // Don't allow updating certain fields
    delete updates.id;
    delete updates.password; // Password updates should go through a separate endpoint
    delete updates.role;
    delete updates.hcmutId;
    delete updates.createdAt;

    // Update user
    const updatedUser = await storage.update<User>(
      'users.json',
      id,
      { ...updates, updatedAt: now() }
    );

    if (!updatedUser) {
      return res.status(404).json(
        errorResponse('Không tìm thấy người dùng')
      );
    }

    // Remove password
    const { password, ...userWithoutPassword } = updatedUser;

    return res.json(
      successResponse(userWithoutPassword, 'Cập nhật thành công')
    );
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json(
      errorResponse('Lỗi cập nhật người dùng: ' + error.message)
    );
  }
}

/**
 * DELETE /api/users/:id
 */
export async function deleteUserHandler(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    // Only management can delete users
    if (currentUser.role !== UserRole.MANAGEMENT) {
      return res.status(403).json(
        errorResponse('Chỉ quản lý mới có thể xóa người dùng')
      );
    }

    const deleted = await storage.delete('users.json', id);

    if (!deleted) {
      return res.status(404).json(
        errorResponse('Không tìm thấy người dùng')
      );
    }

    return res.json(
      successResponse(null, 'Xóa người dùng thành công')
    );
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json(
      errorResponse('Lỗi xóa người dùng: ' + error.message)
    );
  }
}

