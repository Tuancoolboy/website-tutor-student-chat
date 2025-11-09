import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken, JWTPayload } from './utils.js';
import { UserRole } from './types.js';
import { errorResponse } from './utils.js';

/**
 * Extended Request type with user info
 */
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json(
        errorResponse('No authentication token provided', 401)
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json(
        errorResponse('Invalid or expired token', 401)
      );
    }

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json(
      errorResponse('Authentication failed', 401)
    );
  }
};

/**
 * Authorization middleware
 * Checks if user has required role(s)
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(
        errorResponse('Authentication required', 401)
      );
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        errorResponse('Insufficient permissions', 403)
      );
    }

    next();
  };
};

/**
 * CORS middleware
 */
export const cors = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

/**
 * Request logger middleware
 */
export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

/**
 * Error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  const statusCode = (error as any).statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json(
    errorResponse(message, statusCode)
  );
};

/**
 * Validate request body middleware
 */
export const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      return res.status(400).json(
        errorResponse(
          error.errors?.[0]?.message || 'Validation failed',
          400
        )
      );
    }
  };
};

/**
 * Pagination middleware
 * Extracts and validates pagination params
 */
export const paginate = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(
    parseInt(req.query.limit as string) || 10,
    100 // Max limit
  );

  (req as any).pagination = {
    page: Math.max(1, page),
    limit: Math.max(1, limit)
  };

  next();
};

/**
 * Rate limiting (simple in-memory implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      return res.status(429).json(
        errorResponse('Too many requests, please try again later', 429)
      );
    }

    next();
  };
};

/**
 * Clean up old rate limit records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

