import { IAuthRepository } from '../../domain/interfaces/auth.repository.interface';
import { ITokenService } from '../../domain/interfaces/token.service.interface';
import { MessageResponseDTO } from '../dto/auth.dto';

/**
 * Logout Use Case
 * Handles user logout by invalidating refresh tokens
 */
export class LogoutUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Logs out user by invalidating their refresh tokens
   */
  async execute(accessToken: string): Promise<{
    success: boolean;
    data?: MessageResponseDTO;
    error?: string;
    statusCode?: number;
  }> {
    try {
      // Step 1: Verify access token and get user ID
      const tokenPayload = await this.tokenService.verifyAccessToken(accessToken);
      
      // Step 2: Delete all refresh tokens for the user (logout from all devices)
      await this.authRepository.deleteAllUserRefreshTokens(tokenPayload.userId);
      
      // Step 3: Log security event
      console.log('User logout', {
        userId: tokenPayload.userId,
        email: tokenPayload.email,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      };
      
    } catch (error) {
      console.error('Logout use case error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          // Even if token is expired, we can still proceed with logout
          return {
            success: true,
            data: {
              message: 'Logged out successfully'
            }
          };
        }
        
        if (error.message.includes('invalid')) {
          return {
            success: false,
            error: 'Invalid access token',
            statusCode: 401
          };
        }
      }
      
      return {
        success: false,
        error: 'Logout failed',
        statusCode: 500
      };
    }
  }

  /**
   * Logs out user from specific device by refresh token
   */
  async executeFromDevice(refreshToken: string): Promise<{
    success: boolean;
    data?: MessageResponseDTO;
    error?: string;
    statusCode?: number;
  }> {
    try {
      // Step 1: Verify refresh token
      const tokenPayload = await this.tokenService.verifyRefreshToken(refreshToken);
      
      // Step 2: Hash refresh token for lookup
      const refreshTokenHash = await this.authRepository.hashPassword(refreshToken);
      
      // Step 3: Delete specific refresh token
      await this.authRepository.deleteRefreshToken(tokenPayload.userId, refreshTokenHash);
      
      return {
        success: true,
        data: {
          message: 'Logged out from current device successfully'
        }
      };
      
    } catch (error) {
      console.error('Device logout use case error:', error);
      
      return {
        success: false,
        error: 'Device logout failed',
        statusCode: 500
      };
    }
  }
}