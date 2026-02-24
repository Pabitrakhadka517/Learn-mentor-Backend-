import { Router } from 'express';
import { AuthControllerClean } from '../controllers/auth.controller.clean';
import {
  authRateLimit,
  loginRateLimit,
  registrationRateLimit,
  passwordResetRateLimit,
  tokenRefreshRateLimit
} from '../middleware/rate-limit.middleware';

/**
 * Creates authentication routes following Clean Architecture
 */
export function createAuthRoutes(authController: AuthControllerClean): Router {
  const router = Router();

  /**
   * @route POST /api/auth/register
   * @desc Register new user (STUDENT or TUTOR only)
   * @access Public
   * @rateLimit 5 attempts per hour per IP
   * @body {
   *   email: string,
   *   password: string,
   *   fullName: string,
   *   phone?: string,
   *   role?: 'STUDENT' | 'TUTOR'
   * }
   */
  router.post(
    '/register',
    registrationRateLimit,
    (req, res) => authController.register(req, res)
  );

  /**
   * @route POST /api/auth/login
   * @desc Login user with email and password
   * @access Public
   * @rateLimit 10 attempts per 15 minutes per IP
   * @body {
   *   email: string,
   *   password: string
   * }
   */
  router.post(
    '/login',
    loginRateLimit,
    (req, res) => authController.login(req, res)
  );

  /**
   * @route POST /api/auth/refresh
   * @desc Refresh access token using refresh token
   * @access Public
   * @rateLimit 60 attempts per hour per token
   * @body {
   *   refreshToken: string
   * }
   */
  router.post(
    '/refresh',
    tokenRefreshRateLimit,
    (req, res) => authController.refresh(req, res)
  );

  /**
   * @route POST /api/auth/logout
   * @desc Logout user and invalidate refresh tokens
   * @access Private (requires access token)
   * @header Authorization: Bearer <access_token>
   */
  router.post(
    '/logout',
    authRateLimit,
    (req, res) => authController.logout(req, res)
  );

  /**
   * @route POST /api/auth/forgot-password
   * @desc Request password reset
   * @access Public
   * @rateLimit 5 attempts per hour per IP
   * @body {
   *   email: string
   * }
   */
  router.post(
    '/forgot-password',
    passwordResetRateLimit,
    (req, res) => authController.forgotPassword(req, res)
  );

  /**
   * @route POST /api/auth/reset-password
   * @desc Reset password using reset token
   * @access Public
   * @rateLimit 5 attempts per hour per IP
   * @body {
   *   token: string,
   *   newPassword: string
   * }
   */
  router.post(
    '/reset-password',
    passwordResetRateLimit,
    (req, res) => authController.resetPassword(req, res)
  );

  /**
   * @route GET /api/auth/profile
   * @desc Get current user profile
   * @access Private (requires access token)
   * @header Authorization: Bearer <access_token>
   */
  router.get(
    '/profile',
    authRateLimit,
    (req, res) => authController.getProfile(req, res)
  );

  // Legacy routes for backward compatibility
  
  /**
   * @route POST /api/auth/register/student
   * @desc Register new student (legacy route)
   * @access Public
   */
  router.post(
    '/register/student',
    registrationRateLimit,
    (req, res) => {
      req.body.role = 'STUDENT';
      authController.register(req, res);
    }
  );

  /**
   * @route POST /api/auth/register/tutor
   * @desc Register new tutor (legacy route)
   * @access Public
   */
  router.post(
    '/register/tutor',
    registrationRateLimit,
    (req, res) => {
      req.body.role = 'TUTOR';
      authController.register(req, res);
    }
  );

  return router;
}

export default createAuthRoutes;