/**
 * POST /api/auth/register
 * User Registration
 */

import { Request, Response } from 'express';
import { storage } from '../../lib/storage.js';
import { 
  hashPassword,
  generateToken,
  generateRefreshToken,
  generateId,
  generateHCMUTId,
  now,
  successResponse,
  errorResponse
} from '../../lib/utils.js';
import { User, UserRole, Student, Tutor, Management } from '../../lib/types.js';

export async function registerHandler(req: Request, res: Response) {
  try {
    const { email, password, name, role, ...additionalData } = req.body;

    // Check if email already exists
    const existingUsers = await storage.find<User>(
      'users.json',
      (user) => user.email === email
    );

    if (existingUsers.length > 0) {
      return res.status(400).json(
        errorResponse('Email đã được sử dụng')
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create base user object
    const baseUser = {
      id: generateId(role === UserRole.STUDENT ? 'stu' : role === UserRole.TUTOR ? 'tut' : 'mgmt'),
      email,
      password: hashedPassword,
      name,
      hcmutId: generateHCMUTId(),
      role,
      createdAt: now(),
      updatedAt: now()
    };

    let newUser: User;

    // Create role-specific user
    switch (role) {
      case UserRole.STUDENT:
        newUser = {
          ...baseUser,
          role: UserRole.STUDENT,
          major: additionalData.major,
          year: additionalData.year,
          interests: additionalData.interests || [],
          preferredSubjects: additionalData.preferredSubjects || [],
          phone: additionalData.phone,
          avatar: additionalData.avatar
        } as Student;
        break;

      case UserRole.TUTOR:
        newUser = {
          ...baseUser,
          role: UserRole.TUTOR,
          subjects: additionalData.subjects || [],
          bio: additionalData.bio,
          rating: 0,
          totalSessions: 0,
          availability: [],
          verified: false,
          credentials: additionalData.credentials || [],
          phone: additionalData.phone,
          avatar: additionalData.avatar
        } as Tutor;
        break;

      case UserRole.MANAGEMENT:
        newUser = {
          ...baseUser,
          role: UserRole.MANAGEMENT,
          department: additionalData.department,
          permissions: additionalData.permissions || ['view_analytics'],
          phone: additionalData.phone,
          avatar: additionalData.avatar
        } as Management;
        break;

      default:
        return res.status(400).json(
          errorResponse('Role không hợp lệ')
        );
    }

    // Save to database
    await storage.create('users.json', newUser);

    // Generate tokens
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      hcmutId: newUser.hcmutId
    });

    const refreshToken = generateRefreshToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      hcmutId: newUser.hcmutId
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json(
      successResponse({
        user: userWithoutPassword,
        token,
        refreshToken
      }, 'Đăng ký thành công')
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json(
      errorResponse('Lỗi đăng ký: ' + error.message)
    );
  }
}

