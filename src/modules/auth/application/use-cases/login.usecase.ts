import { IAuthRepository } from '../../domain/interfaces/auth.repository.interface';
import { ITokenService } from '../../domain/interfaces/token.service.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import { LoginDTO, LoginResponseDTO, UserResponseDTO } from '../dto/auth.dto';

/**
 * Login Use Case
 * Handles user authentication business logic following the specified layered flow
 */
export class LoginUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Executes user login
   * Following the layered backend flow:
   * 1. DTO Validation (handled by controller)
   * 2. User lookup by email
   * 3. Account status validation
   * 4. Password verification
   * 5. Token generation
   * 6. Old token cleanup
   * 7. New refresh token storage
   */
  async execute(dto: LoginDTO): Promise<{
    success: boolean;
    data?: LoginResponseDTO;
    error?: string;
    statusCode?: number;
  }> {
    try {
      // Step 1: Find user by email
      const user = await this.authRepository.findByEmail(dto.email);
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials',
          statusCode: 401
        };
      }

      // Step 2: Check if account is active (Business Rule)
      if (!user.isActive) {
        return {
          success: false,
          error: 'Account has been deactivated. Please contact support.',
          statusCode: 403
        };
      }

      // Step 3: Verify password
      const isPasswordValid = await this.authRepository.verifyPassword(
        dto.password,
        user.passwordHash
      );
      
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid credentials',
          statusCode: 401
        };
      }

      // Step 4: Apply security rules
      await this.applySecurityRules(user);

      // Step 5: Generate new access and refresh tokens
      const { accessToken, refreshToken } = await this.tokenService.generateTokens(
        user.id!,
        user.role,
        user.email
      );

      // Step 6: Token rotation - Delete old refresh tokens (Security Best Practice)
      await this.authRepository.deleteAllUserRefreshTokens(user.id!);

      // Step 7: Hash and store new refresh token
      const refreshTokenHash = await this.authRepository.hashPassword(refreshToken);
      const refreshTokenEntity = RefreshTokenEntity.createWithExpiry(
        user.id!,
        refreshTokenHash,
        7 // 7 days expiry
      );
      await this.authRepository.storeRefreshToken(refreshTokenEntity);

      // Step 8: Update last login time (if tracking this)
      // This could be handled by updating the user entity
      
      // Step 9: Prepare user response
      const userResponse: UserResponseDTO = {
        id: user.id!,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
        profileImage: user.profileImage,
        speciality: user.speciality,
        address: user.address,
        theme: user.theme,
        isVerified: user.isVerified,
        verificationStatus: this.getVerificationStatus(user),
        isActive: user.isActive,
        balance: user.balance,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return {
        success: true,
        data: {
          message: 'Login successful',
          accessToken,
          refreshToken,
          user: userResponse
        }
      };

    } catch (error) {
      console.error('Login use case error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
        statusCode: 500
      };
    }
  }

  /**
   * Applies security rules during login
   */
  private async applySecurityRules(user: UserEntity): Promise<void> {
    // Check for suspicious login patterns
    // Could implement:
    // - Failed login attempt tracking
    // - Geolocation checks
    // - Device fingerprinting
    // - Time-based restrictions
    
    // For now, basic checks:
    if (user.role === 'ADMIN' && !user.isVerified) {
      throw new Error('Admin account must be verified');
    }
  }

  /**
   * Gets verification status based on user type
   */
  private getVerificationStatus(user: UserEntity): string | undefined {
    if (user.role === 'TUTOR') {
      return user.isVerified ? 'VERIFIED' : 'PENDING';
    }
    return undefined;
  }

  /**
   * Validates login business rules
   */
  private validateLoginRules(user: UserEntity): void {
    // Check if user needs to complete profile
    if (!user.hasCompleteProfile() && user.role === 'TUTOR') {
      throw new Error('Profile completion required for tutors');
    }

    // Check verification requirements
    if (user.role === 'TUTOR' && !user.isVerified) {
      // Allow login but flags will be set in response
      console.log(`Tutor login with pending verification: ${user.id}`);
    }
  }

  /**
   * Logs security events
   */
  private async logSecurityEvent(user: UserEntity, event: string, details?: any): Promise<void> {
    // This would integrate with a security logging service
    console.log(`Security Event: ${event}`, {
      userId: user.id,
      email: user.email,
      role: user.role,
      timestamp: new Date().toISOString(),
      details
    });
  }
}