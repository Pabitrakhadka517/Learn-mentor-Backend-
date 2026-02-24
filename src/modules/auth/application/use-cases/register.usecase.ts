import { IAuthRepository } from '../../domain/interfaces/auth.repository.interface';
import { ITokenService } from '../../domain/interfaces/token.service.interface';
import { UserEntity, UserRole } from '../../domain/entities/user.entity';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import { RegisterDTO, RegisterResponseDTO, UserResponseDTO } from '../dto/auth.dto';

/**
 * Registration Use Case
 * Handles user registration business logic following the specified layered flow
 */
export class RegisterUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Executes user registration
   * Following the layered backend flow:
   * 1. DTO Validation (handled by controller)
   * 2. Email existence check
   * 3. Password hashing
   * 4. User creation
   * 5. Token generation
   * 6. Refresh token storage
   */
  async execute(dto: RegisterDTO): Promise<{
    success: boolean;
    data?: RegisterResponseDTO;
    error?: string;
  }> {
    try {
      // Step 1: Check if email already exists
      const emailExists = await this.authRepository.emailExists(dto.email);
      if (emailExists) {
        return {
          success: false,
          error: 'Email already exists'
        };
      }

      // Step 2: Hash password using repository
      const passwordHash = await this.authRepository.hashPassword(dto.password);

      // Step 4: Create user entity with business logic
      const userEntity = new UserEntity(
        dto.email,
        passwordHash,
        dto.role || 'STUDENT',
        dto.fullName,
        dto.phone,
        false, // isVerified - false for new users (except admin)
        true,  // isActive - true by default
        0,     // balance - 0 for new users
        'system' // theme - default
      );

      // Step 5: Persist user in repository
      const createdUser = await this.authRepository.createUser(userEntity);

      // Step 6: Generate access and refresh tokens
      const { accessToken, refreshToken } = await this.tokenService.generateTokens(
        createdUser.id!,
        createdUser.role,
        createdUser.email
      );

      // Step 7: Hash and store refresh token
      const refreshTokenHash = await this.authRepository.hashPassword(refreshToken);
      const refreshTokenEntity = RefreshTokenEntity.createWithExpiry(
        createdUser.id!,
        refreshTokenHash,
        7 // 7 days expiry
      );
      await this.authRepository.storeRefreshToken(refreshTokenEntity);

      // Step 8: Create initial profile based on role
      if (createdUser.role === 'TUTOR') {
        // Note: This would typically be handled by a separate TutorProfileService
        // For now, we just set the user as created, profile creation happens separately
        console.log(`Created TUTOR user: ${createdUser.id}, profile creation needed`);
      }

      // Step 9: Prepare response
      const userResponse: UserResponseDTO = {
        id: createdUser.id!,
        email: createdUser.email,
        role: createdUser.role,
        fullName: createdUser.fullName,
        phone: createdUser.phone,
        profileImage: createdUser.profileImage,
        speciality: createdUser.speciality,
        address: createdUser.address,
        theme: createdUser.theme,
        isVerified: createdUser.isVerified,
        verificationStatus: createdUser.role === 'TUTOR' ? 'PENDING' : undefined,
        isActive: createdUser.isActive,
        balance: createdUser.balance,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt
      };

      return {
        success: true,
        data: {
          message: 'User registered successfully',
          accessToken,
          refreshToken,
          user: userResponse
        }
      };

    } catch (error) {
      console.error('Registration use case error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  /**
   * Validates business rules for registration
   */
  private validateBusinessRules(dto: RegisterDTO): void {
    // Role validation
    if (dto.role && !['STUDENT', 'TUTOR'].includes(dto.role)) {
      throw new Error('Invalid role for public registration');
    }

    // Email domain validation (if needed)
    const emailDomain = dto.email.split('@')[1];
    const blockedDomains = ['tempmail.com', '10minutemail.com']; // Add blocked domains
    if (blockedDomains.includes(emailDomain)) {
      throw new Error('Email domain is not allowed');
    }
  }

  /**
   * Applies business logic after user creation
   */
  private async applyPostCreationLogic(user: UserEntity): Promise<void> {
    // Send welcome email (would be handled by notification service)
    // Create default settings
    // Log registration event
    // etc.
  }
}