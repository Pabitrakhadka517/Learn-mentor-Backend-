import { Request, Response } from 'express';
import { RegisterUseCase } from '../../application/use-cases/register.usecase';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { RegisterDTOSchema, LoginDTOSchema, RegisterDTO, LoginDTO } from '../../application/dto/auth.dto';

/**
 * Clean Architecture Authentication Controller
 * Handles HTTP requests for authentication endpoints
 * Following the layered backend flow with proper separation of concerns
 */
export class AuthControllerClean {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase
  ) {}

  /**
   * Register new user (STUDENT or TUTOR only)
   * POST /api/auth/register
   * 
   * Layered flow:
   * 1. Rate limiting (middleware)
   * 2. DTO validation (controller)
   * 3. Business logic (use case)
   * 4. Response formatting (controller)
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // LAYER 1: DTO Validation using Zod
      // Validates email format, password strength, role (STUDENT/TUTOR only)
      const validationResult = RegisterDTOSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(error => ({
            field: error.path.join('.'),
            message: error.message
          }))
        });
        return;
      }

      const dto: RegisterDTO = validationResult.data;

      // Map role based on sub-route if not explicitly provided
      if (!dto.role) {
        if (req.path.includes('/tutor')) {
          dto.role = 'TUTOR';
        } else if (req.path.includes('/student') || req.path.includes('/user')) {
          dto.role = 'STUDENT';
        } else {
          dto.role = 'STUDENT'; // Default
        }
      }

      // LAYER 2: Execute business logic through use case
      const result = await this.registerUseCase.execute(dto);

      // LAYER 3: Format and return response
      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.data!.message,
          accessToken: result.data!.accessToken,
          refreshToken: result.data!.refreshToken,
          user: result.data!.user
        });
      } else {
        // Handle business logic errors
        const statusCode = this.getErrorStatusCode(result.error!);
        res.status(statusCode).json({
          success: false,
          message: result.error
        });
      }

    } catch (error) {
      console.error('Registration controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   * 
   * Layered flow:
   * 1. Rate limiting (middleware)
   * 2. DTO validation (controller) 
   * 3. Business logic (use case)
   * 4. Response formatting (controller)
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // LAYER 1: DTO Validation using Zod
      // Validates email format and password presence
      const validationResult = LoginDTOSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(error => ({
            field: error.path.join('.'),
            message: error.message
          }))
        });
        return;
      }

      const dto: LoginDTO = validationResult.data;

      // LAYER 2: Execute business logic through use case
      const result = await this.loginUseCase.execute(dto);

      // LAYER 3: Format and return response
      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.data!.message,
          accessToken: result.data!.accessToken,
          refreshToken: result.data!.refreshToken,
          user: result.data!.user
        });
      } else {
        // Handle business logic errors with appropriate status codes
        const statusCode = result.statusCode || this.getErrorStatusCode(result.error!);
        res.status(statusCode).json({
          success: false,
          message: result.error
        });
      }

    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      // Extract refresh token from body or header
      let refreshToken = req.body.refreshToken;
      
      if (!refreshToken && req.headers.authorization?.startsWith('Bearer ')) {
        refreshToken = req.headers.authorization.split(' ')[1];
      }

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
        return;
      }

      // TODO: Implement refresh token use case
      // For now, return not implemented
      res.status(501).json({
        success: false,
        message: 'Token refresh not implemented yet'
      });

    } catch (error) {
      console.error('Token refresh controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during token refresh'
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Extract access token to get user ID
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'No authentication token provided'
        });
        return;
      }

      // TODO: Implement logout use case
      // Should invalidate refresh tokens for the user
      res.status(501).json({
        success: false,
        message: 'Logout not implemented yet'
      });

    } catch (error) {
      console.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during logout'
      });
    }
  }

  /**
   * Forgot password
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement forgot password use case
      res.status(501).json({
        success: false,
        message: 'Forgot password not implemented yet'
      });

    } catch (error) {
      console.error('Forgot password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password reset request'
      });
    }
  }

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement reset password use case
      res.status(501).json({
        success: false,
        message: 'Reset password not implemented yet'
      });

    } catch (error) {
      console.error('Reset password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password reset'
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement get profile use case
      res.status(501).json({
        success: false,
        message: 'Get profile not implemented yet'
      });

    } catch (error) {
      console.error('Get profile controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching profile'
      });
    }
  }

  /**
   * Maps error messages to appropriate HTTP status codes
   */
  private getErrorStatusCode(errorMessage: string): number {
    const errorMap: { [key: string]: number } = {
      'email already exists': 409,
      'invalid credentials': 401,
      'account has been deactivated': 403,
      'admin accounts cannot be created': 403,
      'email domain is not allowed': 400,
      'user not found': 404,
      'invalid password': 401,
      'account not verified': 403
    };

    const lowerErrorMessage = errorMessage.toLowerCase();
    for (const [key, statusCode] of Object.entries(errorMap)) {
      if (lowerErrorMessage.includes(key)) {
        return statusCode;
      }
    }

    return 400; // Default bad request
  }

  /**
   * Validates request rate limiting headers
   */
  private setRateLimitHeaders(res: Response, limit: number, current: number): void {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + 900); // 15 min reset
  }

  /**
   * Logs authentication events for security monitoring
   */
  private logSecurityEvent(event: string, email?: string, success: boolean = true): void {
    console.log(`Auth Security Event: ${event}`, {
      email: email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : undefined, // Partial email masking
      success,
      timestamp: new Date().toISOString(),
      userAgent: 'request.headers["user-agent"]', // Would get from request
      ip: 'request.ip' // Would get from request
    });
  }
}