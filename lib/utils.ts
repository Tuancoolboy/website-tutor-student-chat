import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from './types.js';
import { config } from './config.js';

// ===== ID GENERATION =====

/**
 * Generate unique ID for entities
 */
export const generateId = (prefix?: string): string => {
  const id = nanoid(12);
  return prefix ? `${prefix}_${id}` : id;
};

/**
 * Generate HCMUT Student/Staff ID
 */
export const generateHCMUTId = (): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${year}${random}`;
};

// ===== PASSWORD HASHING =====

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// ===== JWT TOKENS =====

// Use JWT_SECRET from config to ensure consistency across all servers
// This ensures API server and WebSocket server use the same JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || config.jwt.secret;
const JWT_EXPIRES_IN = (config.jwt.expiresIn || '7d') as string;
const REFRESH_TOKEN_EXPIRES_IN = (config.jwt.refreshExpiresIn || '30d') as string;

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  hcmutId: string;
}

/**
 * Generate JWT access token
 */
export const generateToken = (payload: JWTPayload): string => {
  // Log JWT_SECRET being used (first 10 chars for security)
  if (process.env.NODE_ENV === 'development') {
    console.log('[JWT] Generating token with secret:', JWT_SECRET.substring(0, 10) + '...');
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - jwt.sign accepts string for expiresIn, TypeScript types may be incorrect
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - jwt.sign accepts string for expiresIn, TypeScript types may be incorrect
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// ===== EMAIL UTILITIES =====

/**
 * Extract name from HCMUT email
 */
export const extractNameFromEmail = (email: string): string => {
  const username = email.split('@')[0];
  // Convert something like "nguyen.van.a" to "Nguyen Van A"
  return username
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Determine user role from email
 */
export const determineRoleFromEmail = (email: string): UserRole => {
  const username = email.split('@')[0];
  
  // Simple heuristic: student emails start with year (e.g., 22xxxxx)
  if (/^\d{2}/.test(username)) {
    return UserRole.STUDENT;
  }
  
  // Management/staff might have specific patterns
  if (username.includes('admin') || username.includes('mgmt')) {
    return UserRole.MANAGEMENT;
  }
  
  // Default to tutor
  return UserRole.TUTOR;
};

/**
 * Validate HCMUT email
 */
export const isValidHCMUTEmail = (email: string): boolean => {
  return email.endsWith('@hcmut.edu.vn');
};

// ===== DATE & TIME UTILITIES =====

/**
 * Get current ISO timestamp
 */
export const now = (): string => new Date().toISOString();

/**
 * Format date for display
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format time for display
 */
export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Check if date is in the past
 */
export const isPast = (date: string | Date): boolean => {
  return new Date(date) < new Date();
};

/**
 * Check if date is in the future
 */
export const isFuture = (date: string | Date): boolean => {
  return new Date(date) > new Date();
};

/**
 * Add days to date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Calculate duration between two dates in minutes
 */
export const calculateDuration = (start: string | Date, end: string | Date): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
};

// ===== VALIDATION UTILITIES =====

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Vietnamese format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(0|\+84)[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return strongPasswordRegex.test(password);
};

// ===== ARRAY UTILITIES =====

/**
 * Shuffle array randomly
 */
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Get unique values from array
 */
export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * Group array by key
 */
export const groupBy = <T>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const value = String(item[key]);
    groups[value] = groups[value] || [];
    groups[value].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

// ===== NUMBER UTILITIES =====

/**
 * Generate random number in range
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Round to decimal places
 */
export const round = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Calculate percentage
 */
export const percentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return round((value / total) * 100, 1);
};

// ===== STRING UTILITIES =====

/**
 * Slugify string
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Truncate string
 */
export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// ===== ERROR HANDLING =====

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string
): AppError => {
  return new AppError(message, statusCode, code);
};

// ===== API RESPONSE HELPERS =====

export const successResponse = <T = any>(data: T, message?: string) => {
  return {
    success: true,
    data,
    ...(message && { message })
  };
};

export const errorResponse = (error: string | Error, statusCode?: number) => {
  return {
    success: false,
    error: error instanceof Error ? error.message : error,
    ...(statusCode && { statusCode })
  };
};

export const paginatedResponse = <T = any>(
  data: T[],
  page: number,
  limit: number,
  total: number
) => {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

