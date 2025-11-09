/**
 * EXAMPLE API ROUTE
 * 
 * File này là template/example cho Team A khi implement API routes
 * Xóa hoặc rename file này khi bắt đầu implement APIs thực tế
 */

import { Request, Response } from 'express';
import { storage } from '../lib/storage.js';
import { authenticate, authorize, validateBody } from '../lib/middleware.js';
import { successResponse, errorResponse, generateId, now } from '../lib/utils.js';
import { loginSchema } from '../lib/schemas.js';
import { User, UserRole, ApiResponse } from '../lib/types.js';

// ===== EXAMPLE 1: Simple GET endpoint =====

/**
 * GET /api/example/hello
 * Public endpoint - no authentication required
 */
export async function getHello(req: Request, res: Response) {
  return res.json(
    successResponse({ message: 'Hello from Tutor Support API!' })
  );
}

// ===== EXAMPLE 2: GET with authentication =====

/**
 * GET /api/example/profile
 * Protected endpoint - requires authentication
 */
export async function getProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    
    const user = await storage.findById<User>('users.json', userId);
    
    if (!user) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }

    // Don't send password
    const { password, ...userWithoutPassword } = user;

    return res.json(successResponse(userWithoutPassword));
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return res.status(500).json(
      errorResponse(error.message)
    );
  }
}

// ===== EXAMPLE 3: GET with pagination =====

/**
 * GET /api/example/users?page=1&limit=10
 * List users with pagination
 */
export async function listUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as UserRole | undefined;

    const result = await storage.paginate<User>(
      'users.json',
      page,
      limit,
      role ? (user) => user.role === role : undefined
    );

    // Remove passwords
    result.data = result.data.map(({ password, ...user }) => user);

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
}

// ===== EXAMPLE 4: POST with validation =====

/**
 * POST /api/example/login
 * Login with email and password
 * Body: { email, password }
 */
export async function login(req: Request, res: Response) {
  try {
    // Validation đã được xử lý bởi validateBody middleware
    const { email, password } = req.body;

    // Find user
    const users = await storage.find<User>(
      'users.json',
      (user) => user.email === email
    );

    if (users.length === 0) {
      return res.status(401).json(
        errorResponse('Invalid credentials', 401)
      );
    }

    const user = users[0];

    // Verify password (in real implementation)
    // const isValid = await comparePassword(password, user.password);
    // if (!isValid) { return error }

    // Generate token (in real implementation)
    // const token = generateToken({ ... });

    const { password: _, ...userWithoutPassword } = user;

    return res.json(
      successResponse({
        user: userWithoutPassword,
        token: 'example_token_here'
      })
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
}

// ===== EXAMPLE 5: POST to create resource =====

/**
 * POST /api/example/users
 * Create new user
 * Requires MANAGEMENT role
 */
export async function createUser(req: Request, res: Response) {
  try {
    const userData = req.body;

    // Create user object
    const newUser: User = {
      id: generateId('user'),
      ...userData,
      createdAt: now(),
      updatedAt: now()
    };

    // Save to database
    await storage.create('users.json', newUser);

    const { password, ...userWithoutPassword } = newUser;

    return res.status(201).json(
      successResponse(userWithoutPassword, 'User created successfully')
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
}

// ===== EXAMPLE 6: PUT to update resource =====

/**
 * PUT /api/example/users/:id
 * Update user
 * User can only update their own profile, unless MANAGEMENT
 */
export async function updateUser(req: Request, res: Response) {
  try {
    const userId = req.params.id;
    const updates = req.body;
    const currentUser = (req as any).user;

    // Authorization check
    if (
      currentUser.userId !== userId && 
      currentUser.role !== UserRole.MANAGEMENT
    ) {
      return res.status(403).json(
        errorResponse('Forbidden', 403)
      );
    }

    // Update user
    const updatedUser = await storage.update<User>(
      'users.json',
      userId,
      { ...updates, updatedAt: now() }
    );

    if (!updatedUser) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }

    const { password, ...userWithoutPassword } = updatedUser;

    return res.json(
      successResponse(userWithoutPassword, 'User updated successfully')
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
}

// ===== EXAMPLE 7: DELETE resource =====

/**
 * DELETE /api/example/users/:id
 * Delete user
 * Requires MANAGEMENT role
 */
export async function deleteUser(req: Request, res: Response) {
  try {
    const userId = req.params.id;

    const deleted = await storage.delete('users.json', userId);

    if (!deleted) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }

    return res.json(
      successResponse(null, 'User deleted successfully')
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
}

// ===== EXAMPLE 8: Complex query =====

/**
 * GET /api/example/search
 * Search with multiple filters
 */
export async function search(req: Request, res: Response) {
  try {
    const { query, role, minRating } = req.query;

    const users = await storage.find<User>('users.json', (user) => {
      // Filter by role
      if (role && user.role !== role) return false;

      // Filter by rating (for tutors)
      if (minRating && user.role === UserRole.TUTOR) {
        if ((user as any).rating < parseFloat(minRating as string)) {
          return false;
        }
      }

      // Filter by search query
      if (query) {
        const searchLower = (query as string).toLowerCase();
        return (
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Remove passwords
    const cleanUsers = users.map(({ password, ...user }) => user);

    return res.json(successResponse(cleanUsers));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
}

// ===== EXAMPLE ROUTER SETUP =====

/**
 * Example Express router setup
 * 
 * import express from 'express';
 * import * as exampleController from './example';
 * 
 * const router = express.Router();
 * 
 * // Public routes
 * router.get('/hello', exampleController.getHello);
 * router.post('/login', validateBody(loginSchema), exampleController.login);
 * 
 * // Protected routes
 * router.get('/profile', authenticate, exampleController.getProfile);
 * router.get('/users', authenticate, exampleController.listUsers);
 * 
 * // Admin only routes
 * router.post('/users', 
 *   authenticate, 
 *   authorize(UserRole.MANAGEMENT),
 *   exampleController.createUser
 * );
 * 
 * router.put('/users/:id', authenticate, exampleController.updateUser);
 * 
 * router.delete('/users/:id',
 *   authenticate,
 *   authorize(UserRole.MANAGEMENT),
 *   exampleController.deleteUser
 * );
 * 
 * export default router;
 */

// ===== COMMON PATTERNS =====

/**
 * PATTERN 1: Check ownership
 * 
 * const session = await storage.findById('sessions.json', sessionId);
 * if (session.studentId !== currentUser.userId) {
 *   return res.status(403).json(errorResponse('Forbidden'));
 * }
 */

/**
 * PATTERN 2: Validate relationships
 * 
 * const tutor = await storage.findById('users.json', tutorId);
 * if (!tutor || tutor.role !== UserRole.TUTOR) {
 *   return res.status(400).json(errorResponse('Invalid tutor'));
 * }
 */

/**
 * PATTERN 3: Update with relationships
 * 
 * // Update session status
 * await storage.update('sessions.json', sessionId, { 
 *   status: SessionStatus.COMPLETED 
 * });
 * 
 * // Create notification
 * await storage.create('notifications.json', {
 *   id: generateId('notif'),
 *   userId: session.studentId,
 *   type: NotificationType.SESSION_COMPLETED,
 *   message: 'Your session has been completed',
 *   createdAt: now()
 * });
 */

/**
 * PATTERN 4: Aggregate data
 * 
 * const sessions = await storage.find('sessions.json',
 *   (s) => s.tutorId === tutorId && s.status === SessionStatus.COMPLETED
 * );
 * 
 * const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;
 */

export default {
  getHello,
  getProfile,
  listUsers,
  login,
  createUser,
  updateUser,
  deleteUser,
  search
};

