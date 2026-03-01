import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { EmailService } from '../notification/email.service';
import { jwtConfig } from '../../config/jwt';
import {
  RegisterDTO,
  LoginDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  RegisterResponseDTO,
  LoginResponseDTO,
  RefreshResponseDTO,
  MessageResponseDTO,
  UserResponseDTO,
  RegisterDTOSchema,
  LoginDTOSchema,
  ForgotPasswordDTOSchema,
  ResetPasswordDTOSchema,
} from './auth.dto';
import { UserRole } from './user.model';

export class AuthService {
  private static normalizeRole(rawRole?: string): UserRole {
    const normalized = (rawRole || 'STUDENT').toString().trim().toUpperCase();
    if (normalized === 'TUTOR') return 'TUTOR';
    if (normalized === 'ADMIN') return 'ADMIN';
    if (normalized === 'USER') return 'STUDENT';
    return 'STUDENT';
  }

  /**
   * Register a new STUDENT or TUTOR (public registration)
   * ADMIN cannot register via this endpoint
   */
  static async register(dto: RegisterDTO): Promise<RegisterResponseDTO> {
    // Validate DTO
    const validated = RegisterDTOSchema.parse(dto);

    // Ensure role is not ADMIN (admins can only be created manually)
    if ((validated.role as string) === 'ADMIN') {
      throw new Error('Admin accounts cannot be created via public registration');
    }

    // Check if email already exists
    const emailExists = await AuthRepository.emailExists(validated.email);
    if (emailExists) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await AuthRepository.hashPassword(validated.password);

    // Create user with default role STUDENT
    const role = validated.role || 'STUDENT';
    const user = await AuthRepository.createUser(
      validated.email,
      passwordHash,
      role,
      validated.fullName,
      validated.phone
    );

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user._id.toString(), user.role, user.email);

    // Store refresh token
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const refreshTokenHash = await AuthRepository.hashPassword(refreshToken);
    await AuthRepository.storeRefreshToken(user._id.toString(), refreshTokenHash, refreshTokenExpiry);

    // Create initial TutorProfile if role is TUTOR
    let verificationStatus = 'PENDING';
    if (role === 'TUTOR') {
      const { TutorProfile } = require('../tutor/tutor.model');
      await TutorProfile.create({ user: user._id, verificationStatus: 'PENDING' });
    }

    return {
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: await this.getUserWithProfile(user._id.toString()),
    };
  }

  /**
   * Login user with email and password
   * Validates account status (isActive, isVerified for tutors)
   */
  static async login(dto: LoginDTO): Promise<LoginResponseDTO> {
    // Validate DTO
    const validated = LoginDTOSchema.parse(dto);

    // Find user by email
    const user = await AuthRepository.findByEmail(validated.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('Account is deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await AuthRepository.verifyPassword(
      validated.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Validate role if expectedRole is provided (role-based login enforcement)
    const canonicalUserRole = this.normalizeRole(user.role as unknown as string);
    const canonicalExpectedRole = validated.expectedRole
      ? this.normalizeRole(validated.expectedRole as unknown as string)
      : undefined;

    if (canonicalExpectedRole && canonicalUserRole !== canonicalExpectedRole) {
      const roleLabel = validated.expectedRole === 'STUDENT' ? 'Student' : validated.expectedRole === 'TUTOR' ? 'Tutor' : 'Admin';
      const actualLabel = canonicalUserRole === 'STUDENT' ? 'Student' : canonicalUserRole === 'TUTOR' ? 'Tutor' : 'Admin';
      throw Object.assign(
        new Error(`This account is registered as a ${actualLabel}. Please use the ${actualLabel} login page instead.`),
        { statusCode: 403 }
      );
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user._id.toString(), canonicalUserRole, user.email);

    // Store refresh token
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const refreshTokenHash = await AuthRepository.hashPassword(refreshToken);
    await AuthRepository.storeRefreshToken(user._id.toString(), refreshTokenHash, refreshTokenExpiry);

    return {
      message: 'Logged in successfully',
      accessToken,
      refreshToken,
      user: await this.getUserWithProfile(user._id.toString()),
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<RefreshResponseDTO> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, jwtConfig.refreshSecret) as any;

      // Find user
      const user = await AuthRepository.findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if account is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify refresh token exists in database using bcrypt.compare
      const storedToken = await AuthRepository.findRefreshTokenByCompare(user._id.toString(), refreshToken);

      if (!storedToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const canonicalRole = this.normalizeRole(user.role as unknown as string);
      const accessToken = jwt.sign(
        {
          userId: user._id.toString(),
          role: canonicalRole,
          email: user.email,
        },
        jwtConfig.accessSecret as string,
        { expiresIn: jwtConfig.accessExpiry as any }
      );

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token. Please login again.');
    }
  }

  /**
   * Logout user by removing refresh token
   */
  static async logout(userId: string): Promise<MessageResponseDTO> {
    await AuthRepository.deleteRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }

  /**
   * Forgot password - generate reset token
   */
  static async forgotPassword(dto: ForgotPasswordDTO): Promise<MessageResponseDTO & { devResetLink?: string; emailPreviewUrl?: string }> {
    const validated = ForgotPasswordDTOSchema.parse(dto);

    // Find user
    const user = await AuthRepository.findByEmail(validated.email);
    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return { message: 'If the email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset token
    await AuthRepository.createPasswordResetToken(user._id.toString(), resetTokenHash, expiresAt);

    // Send email with reset token (returns Ethereal preview URL in dev)
    let emailPreviewUrl: string | undefined;
    try {
      emailPreviewUrl = await EmailService.sendPasswordResetEmail(user.email, resetToken);
      console.log('📧 Password reset email sent successfully to:', user.email);
      if (emailPreviewUrl) {
        console.log('📧 Email preview URL:', emailPreviewUrl);
      }
    } catch (emailError: any) {
      console.error('📧 Email sending failed:', emailError.message);
      // Continue with the flow even if email fails
      emailPreviewUrl = undefined;
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const devResetLink = isDev ? `${frontendUrl}/reset-password?token=${resetToken}` : undefined;

    if (isDev) {
      console.log('🔐 Development Reset Link:', devResetLink);
      console.log('🔑 Reset Token:', resetToken);
    }

    return {
      message: 'If the email exists, a password reset link has been sent.',
      ...(isDev && { devResetLink, emailPreviewUrl: emailPreviewUrl || undefined })
    };
  }

  /**
   * Reset password using reset token
   */
  static async resetPassword(dto: ResetPasswordDTO): Promise<MessageResponseDTO> {
    const validated = ResetPasswordDTOSchema.parse(dto);

    // Find valid reset token using plain token (bcrypt comparison happens in repository)
    const resetToken = await AuthRepository.findPasswordResetToken(validated.token);
    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const newPasswordHash = await AuthRepository.hashPassword(validated.newPassword);

    // Update password
    await AuthRepository.updatePassword(resetToken.userId, newPasswordHash);

    // Mark token as used
    await AuthRepository.markResetTokenAsUsed(resetToken._id.toString());

    // Clear all refresh tokens (force re-login)
    await AuthRepository.deleteRefreshToken(resetToken.userId);

    return { message: 'Password reset successfully. Please login with your new password.' };
  }

  /**
   * Generate access and refresh tokens
   */
  private static async generateTokens(userId: string, role: UserRole, email: string) {
    const accessToken = jwt.sign(
      {
        userId,
        role,
        email,
      },
      jwtConfig.accessSecret as string,
      { expiresIn: jwtConfig.accessExpiry as any }
    );

    const refreshToken = jwt.sign(
      {
        userId,
      },
      jwtConfig.refreshSecret as string,
      { expiresIn: jwtConfig.refreshExpiry as any }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Get user with profile and verification status
   */
  static async getUserWithProfile(userId: string): Promise<UserResponseDTO> {
    const user = await AuthRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const userObj = user.toObject();
    if (user.role === 'TUTOR') {
      const { TutorProfile } = require('../tutor/tutor.model');
      const profile = await TutorProfile.findOne({ user: user._id });
      userObj.verificationStatus = profile?.verificationStatus || 'PENDING';
    }

    return this.mapUserToDTO(userObj);
  }

  /**
   * Map user model to DTO
   */
  private static mapUserToDTO(user: any): UserResponseDTO {
    return {
      id: user._id?.toString() || user._id,
      email: user.email,
      role: this.normalizeRole(user.role as unknown as string),
      fullName: user.fullName,
      phone: user.phone,
      profileImage: user.profileImage,
      speciality: user.speciality,
      address: user.address,
      theme: user.theme,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus, // Expect this to be populated if joined
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
