import { IAuthRepository } from '../../domain/interfaces/auth.repository.interface';
import { ITokenService } from '../../domain/interfaces/token.service.interface';
import { RefreshTokenDTO, RefreshResponseDTO } from '../dto/auth.dto';

/**
 * Refresh Token Use Case
 * Handles access token refresh using refresh tokens
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Refreshes access token using refresh token
   */
  async execute(dto: RefreshTokenDTO): Promise<{
    success: boolean;
    data?: RefreshResponseDTO;
    error?: string;
    statusCode?: number;
  }> {
    try {
      // Step 1: Verify refresh token format and signature
      const tokenPayload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
      
      // Step 2: Hash the refresh token for database lookup
      const refreshTokenHash = await this.authRepository.hashPassword(dto.refreshToken);
      
      // Step 3: Find refresh token in database
      const storedToken = await this.authRepository.findRefreshToken(
        tokenPayload.userId,
        refreshTokenHash
      );
      
      if (!storedToken) {
        return {
          success: false,
          error: 'Refresh token not found or has been revoked',
          statusCode: 401
        };
      }
      
      // Step 4: Check if token is expired
      if (storedToken.isExpired()) {
        // Clean up expired token
        await this.authRepository.deleteRefreshToken(tokenPayload.userId, refreshTokenHash);
        
        return {
          success: false,
          error: 'Refresh token has expired',
          statusCode: 401
        };
      }
      
      // Step 5: Get user information
      const user = await this.authRepository.findById(tokenPayload.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          statusCode: 404
        };
      }
      
      // Step 6: Check if user is still active
      if (!user.isActive) {
        return {
          success: false,
          error: 'User account has been deactivated',
          statusCode: 403
        };
      }
      
      // Step 7: Generate new access token
      const { accessToken } = await this.tokenService.generateTokens(
        user.id!,
        user.role,
        user.email
      );
      
      return {
        success: true,
        data: {
          message: 'Access token refreshed successfully',
          accessToken
        }
      };
      
    } catch (error) {
      console.error('Refresh token use case error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          return {
            success: false,
            error: 'Refresh token has expired',
            statusCode: 401
          };
        }
        
        if (error.message.includes('invalid')) {
          return {
            success: false,
            error: 'Invalid refresh token',
            statusCode: 401
          };
        }
      }
      
      return {
        success: false,
        error: 'Token refresh failed',
        statusCode: 500
      };
    }
  }
}