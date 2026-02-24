import { Router } from 'express';
import { AuthRepositoryImpl } from './infrastructure/repositories/auth.repository.impl';
import { TokenService } from './infrastructure/services/token.service';
import { RegisterUseCase } from './application/use-cases/register.usecase';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.usecase';
import { LogoutUseCase } from './application/use-cases/logout.usecase';
import { AuthControllerClean } from './presentation/controllers/auth.controller.clean';
import { createAuthRoutes } from './presentation/routes/auth.routes.clean';

/**
 * Clean Architecture Authentication Module
 * Implements dependency injection and layered architecture
 */
export class AuthModuleClean {
  private static instance: AuthModuleClean;
  private static isInitialized = false;

  // Infrastructure Layer
  private readonly authRepository: AuthRepositoryImpl;
  private readonly tokenService: TokenService;

  // Application Layer
  private readonly registerUseCase: RegisterUseCase;
  private readonly loginUseCase: LoginUseCase;
  private readonly refreshTokenUseCase: RefreshTokenUseCase;
  private readonly logoutUseCase: LogoutUseCase;

  // Presentation Layer
  private readonly authController: AuthControllerClean;
  private readonly router: Router;

  private constructor() {
    // Infrastructure Layer - External concerns
    this.authRepository = new AuthRepositoryImpl();
    this.tokenService = new TokenService();

    // Application Layer - Business logic coordination
    this.registerUseCase = new RegisterUseCase(
      this.authRepository,
      this.tokenService
    );
    
    this.loginUseCase = new LoginUseCase(
      this.authRepository,
      this.tokenService
    );
    
    this.refreshTokenUseCase = new RefreshTokenUseCase(
      this.authRepository,
      this.tokenService
    );
    
    this.logoutUseCase = new LogoutUseCase(
      this.authRepository,
      this.tokenService
    );

    // Presentation Layer - HTTP interface
    this.authController = new AuthControllerClean(
      this.registerUseCase,
      this.loginUseCase
    );

    // Create routes with dependency injection
    this.router = createAuthRoutes(this.authController);
    
    AuthModuleClean.isInitialized = true;
  }

  /**
   * Singleton pattern implementation
   */
  public static getInstance(): AuthModuleClean {
    if (!AuthModuleClean.instance) {
      AuthModuleClean.instance = new AuthModuleClean();
    }
    return AuthModuleClean.instance;
  }

  /**
   * Gets the configured router for auth routes
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Gets the auth controller (for testing purposes)
   */
  public getController(): AuthControllerClean {
    return this.authController;
  }

  /**
   * Gets the auth repository (for testing purposes)
   */
  public getRepository(): AuthRepositoryImpl {
    return this.authRepository;
  }

  /**
   * Gets the token service (for testing purposes)
   */
  public getTokenService(): TokenService {
    return this.tokenService;
  }

  /**
   * Gets all use cases (for testing purposes)
   */
  public getUseCases() {
    return {
      register: this.registerUseCase,
      login: this.loginUseCase,
      refreshToken: this.refreshTokenUseCase,
      logout: this.logoutUseCase
    };
  }

  /**
   * Health check for the Auth module
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: {
      database: boolean;
      tokenService: boolean;
      repository: boolean;
    };
  }> {
    try {
      // Test database connectivity
      const dbHealthy = await this.testDatabaseConnection();
      
      // Test token service
      const tokenHealthy = await this.testTokenService();
      
      // Test repository operations
      const repoHealthy = await this.testRepository();

      const allHealthy = dbHealthy && tokenHealthy && repoHealthy;

      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks: {
          database: dbHealthy,
          tokenService: tokenHealthy,
          repository: repoHealthy
        }
      };
    } catch (error) {
      console.error('Auth Module health check failed:', error);
      return {
        status: 'unhealthy',
        checks: {
          database: false,
          tokenService: false,
          repository: false
        }
      };
    }
  }

  /**
   * Tests database connection
   */
  private async testDatabaseConnection(): Promise<boolean> {
    try {
      await this.authRepository.getUserCount();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Tests token service
   */
  private async testTokenService(): Promise<boolean> {
    try {
      const { accessToken } = await this.tokenService.generateTokens(
        'test-user-id',
        'STUDENT',
        'test@example.com'
      );
      
      await this.tokenService.verifyAccessToken(accessToken);
      return true;
    } catch (error) {
      console.error('Token service test failed:', error);
      return false;
    }
  }

  /**
   * Tests repository operations
   */
  private async testRepository(): Promise<boolean> {
    try {
      // Test basic repository operations
      const testEmail = 'health-check@test.com';
      const exists = await this.authRepository.emailExists(testEmail);
      
      // This should return false for the test email
      return exists === false;
    } catch (error) {
      console.error('Repository test failed:', error);
      return false;
    }
  }

  /**
   * Cleanup expired tokens
   */
  public async cleanupExpiredTokens(): Promise<number> {
    try {
      return await this.authRepository.cleanupExpiredTokens();
    } catch (error) {
      console.error('Token cleanup failed:', error);
      return 0;
    }
  }

  /**
   * Clean shutdown of the module
   */
  public async shutdown(): Promise<void> {
    try {
      console.log('Auth Module shutting down gracefully...');
      
      // Cleanup expired tokens before shutdown
      const cleanedTokens = await this.cleanupExpiredTokens();
      console.log(`Cleaned up ${cleanedTokens} expired tokens`);
      
      // Reset initialization flag
      AuthModuleClean.isInitialized = false;
      
      console.log('Auth Module shutdown complete');
    } catch (error) {
      console.error('Error during Auth Module shutdown:', error);
    }
  }

  /**
   * Module information
   */
  public getModuleInfo(): {
    name: string;
    version: string;
    initialized: boolean;
    dependencies: string[];
  } {
    return {
      name: 'AuthModuleClean',
      version: '1.0.0',
      initialized: AuthModuleClean.isInitialized,
      dependencies: [
        'mongodb',
        'mongoose',
        'jsonwebtoken',
        'bcryptjs',
        'express',
        'express-rate-limit',
        'zod'
      ]
    };
  }

  /**
   * Static method to initialize the module
   */
  public static async initialize(): Promise<AuthModuleClean> {
    const module = AuthModuleClean.getInstance();
    
    console.log('Auth Module (Clean Architecture) initialized successfully');
    
    return module;
  }
}

/**
 * Export the singleton instance getter as default
 */
export default AuthModuleClean.getInstance;

/**
 * Export for direct router usage
 */
export const authRouter = AuthModuleClean.getInstance().getRouter();

/**
 * Factory function for creating auth module routes
 */
export function createAuthModule(): Router {
  return AuthModuleClean.getInstance().getRouter();
}