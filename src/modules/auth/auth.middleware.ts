import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../../config/jwt';
import { AuthRepository } from './auth.repository';
import { UserRole } from './user.model';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
  };
}

const normalizeRole = (rawRole?: string): UserRole => {
  const normalized = (rawRole || 'STUDENT').toString().trim().toUpperCase();
  if (normalized === 'TUTOR') return 'TUTOR';
  if (normalized === 'ADMIN') return 'ADMIN';
  if (normalized === 'USER') return 'STUDENT';
  return 'STUDENT';
};

/**
 * Authenticate middleware - validates JWT access token
 * Adds user info to request object
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = jwt.verify(token, jwtConfig.accessSecret) as any;

    // Find user
    const user = await AuthRepository.findById(payload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Attach user to request
    req.user = {
      userId: user._id.toString(),
      role: normalizeRole(user.role as unknown as string),
      email: user.email,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your token or login again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please login again.',
    });
  }
};

/**
 * Authorize roles middleware - restricts access based on user role
 * Must be used after authenticate middleware
 * 
 * @param roles - Array of allowed roles
 * 
 * @example
 * router.get('/admin/users', authenticate, authorizeRoles('ADMIN'), controller)
 * router.get('/tutor/earnings', authenticate, authorizeRoles('TUTOR', 'ADMIN'), controller)
 */
export const authorizeRoles = (...roles: UserRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const requesterRole = normalizeRole(req.user.role as unknown as string);
    if (!roles.includes(requesterRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This endpoint requires one of the following roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Authorize single role middleware - convenience wrapper for authorizeRoles
 * Must be used after authenticate middleware
 * 
 * @param role - Single allowed role
 * 
 * @example
 * router.get('/student/dashboard', authenticate, authorizeRole('STUDENT'), controller)
 */
export const authorizeRole = (role: UserRole) => authorizeRoles(role);

/**
 * Verify tutor middleware - checks if tutor is verified
 * Must be used after authenticate middleware
 * Only applies to TUTOR role
 */
export const verifyTutor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  // Only check verification for tutors
  if (req.user.role === 'TUTOR') {
    const user = await AuthRepository.findById(req.user.userId);

    if (!user || !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your tutor account is not verified yet. Please wait for admin approval.',
      });
    }
  }

  next();
};

/**
 * Optional authentication - attaches user if token is valid, but doesn't fail if not
 * Useful for endpoints that work differently for authenticated vs unauthenticated users
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without user
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, jwtConfig.accessSecret) as any;

    const user = await AuthRepository.findById(payload.userId);
    if (user && user.isActive) {
      req.user = {
        userId: user._id.toString(),
        role: normalizeRole(user.role as unknown as string),
        email: user.email,
      };
    }

    next();
  } catch (error) {
    // Token invalid, continue without user
    next();
  }
};