import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from './auth.middleware';

export class AuthController {
  /**
   * Register new user (STUDENT or TUTOR only)
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response) {
    try {
      // Map role based on sub-route if role is not explicitly provided in body
      if (!req.body.role) {
        if (req.path.includes('/tutor')) {
          req.body.role = 'TUTOR';
        } else if (req.path.includes('/user')) {
          req.body.role = 'STUDENT';
        }
      } else {
        // Handle mapped roles from frontend if needed
        if (req.body.role === 'user') req.body.role = 'STUDENT';
        if (req.body.role === 'tutor') req.body.role = 'TUTOR';
      }

      const result = await AuthService.register(req.body);

      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response) {
    try {
      // Normalize expectedRole from request body
      if (req.body.expectedRole) {
        const roleMap: Record<string, string> = {
          USER: 'STUDENT',
          student: 'STUDENT', user: 'STUDENT', STUDENT: 'STUDENT',
          tutor: 'TUTOR', TUTOR: 'TUTOR',
          admin: 'ADMIN', ADMIN: 'ADMIN',
        };
        req.body.expectedRole = roleMap[req.body.expectedRole] || req.body.expectedRole;
      }

      const result = await AuthService.login(req.body);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      // Use statusCode from the error if available (e.g., 403 for role mismatch)
      const statusCode = error.statusCode || 401;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static async refresh(req: Request, res: Response) {
    try {
      let { refreshToken } = req.body;

      // Fallback to Authorization header if not in body
      if (!refreshToken && req.headers.authorization?.startsWith('Bearer ')) {
        refreshToken = req.headers.authorization.split(' ')[1];
      }

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed',
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const result = await AuthService.logout(req.user.userId);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Logout failed',
      });
    }
  }

  /**
   * Forgot password - request reset token
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response) {
    try {
      const result = await AuthService.forgotPassword(req.body);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      // Handle email service errors gracefully
      if (error.message.includes('Email') || error.message.includes('SMTP')) {
        console.warn('Email service error, but continuing:', error.message);
        return res.status(200).json({
          success: true,
          message: 'If the email exists, a password reset link has been sent.',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request. Please try again later.',
      });
    }
  }

  /**
   * Reset password using token
   * POST /api/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      const result = await AuthService.resetPassword(req.body);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Reset password error:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      // Provide specific error messages based on error content
      let statusCode = 400;
      let message = error.message;

      if (message.includes('Invalid or expired reset token')) {
        statusCode = 400;
        message = 'The reset token is invalid or has expired. Please request a new password reset.';
      } else if (message.includes('Password must')) {
        statusCode = 400;
        message = error.message; // Keep the validation message as is
      } else {
        statusCode = 500;
        message = 'Failed to reset password. Please try again later.';
      }

      res.status(statusCode).json({
        success: false,
        message: message,
      });
    }
  }

  /**
   * Get current user info
   * GET /api/auth/me
   */
  static async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const user = await AuthService.getUserWithProfile(req.user.userId);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user info',
      });
    }
  }
}
