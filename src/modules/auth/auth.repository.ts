import bcrypt from 'bcryptjs';
import { User, RefreshToken, PasswordResetToken, IUser, UserRole } from './user.model';
import { bcryptConfig } from '../../config/jwt';

export class AuthRepository {
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, bcryptConfig.saltRounds);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string): Promise<boolean> {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  }

  /**
   * Create a new user
   */
  static async createUser(
    email: string,
    passwordHash: string,
    role: UserRole,
    fullName?: string,
    phone?: string
  ): Promise<IUser> {
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      role,
      fullName,
      phone,
      isVerified: role === 'ADMIN' ? true : false, // Auto-verify admin
      isActive: true,
    });
    return user.save();
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by ID
   */
  static async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  /**
   * Store refresh token
   */
  static async storeRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    // Remove old refresh tokens for this user
    await RefreshToken.deleteMany({ userId });

    // Store new refresh token
    await RefreshToken.create({
      userId,
      tokenHash,
      expiresAt,
    });
  }

  /**
   * Find refresh token by exact hash match (legacy)
   */
  static async findRefreshToken(userId: string, tokenHash: string) {
    return RefreshToken.findOne({
      userId,
      tokenHash,
      expiresAt: { $gt: new Date() }, // Not expired
    });
  }

  /**
   * Find and verify refresh token using bcrypt.compare
   * Returns the stored token document if the raw token matches the stored hash
   */
  static async findRefreshTokenByCompare(userId: string, rawToken: string) {
    const storedTokens = await RefreshToken.find({
      userId,
      expiresAt: { $gt: new Date() },
    });

    for (const stored of storedTokens) {
      const isMatch = await bcrypt.compare(rawToken, stored.tokenHash);
      if (isMatch) return stored;
    }

    return null;
  }

  /**
   * Delete refresh token (logout)
   */
  static async deleteRefreshToken(userId: string): Promise<void> {
    await RefreshToken.deleteMany({ userId });
  }

  /**
   * Create password reset token
   */
  static async createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    // Invalidate old reset tokens
    await PasswordResetToken.updateMany(
      { userId, used: false },
      { used: true }
    );

    // Create new reset token
    await PasswordResetToken.create({
      userId,
      tokenHash,
      expiresAt,
      used: false,
    });
  }

  /**
   * Find valid password reset token by comparing with crypto hash
   */
  static async findPasswordResetToken(plainToken: string) {
    const currentTime = new Date();
    
    // Hash the plain token to compare with stored hash
    const tokenHash = require('crypto').createHash('sha256').update(plainToken).digest('hex');
    
    // Find matching token
    const resetToken = await PasswordResetToken.findOne({
      tokenHash: tokenHash,
      used: false,
      expiresAt: { $gt: currentTime }
    });
    
    return resetToken;
  }

  /**
   * Mark password reset token as used
   */
  static async markResetTokenAsUsed(tokenId: string): Promise<void> {
    await PasswordResetToken.findByIdAndUpdate(tokenId, { used: true });
  }

  /**
   * Update user password
   */
  static async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });
  }

  /**
   * Update user verification status
   */
  static async updateVerificationStatus(userId: string, isVerified: boolean): Promise<void> {
    await User.findByIdAndUpdate(userId, { isVerified });
  }

  /**
   * Update user active status
   */
  static async updateActiveStatus(userId: string, isActive: boolean): Promise<void> {
    await User.findByIdAndUpdate(userId, { isActive });
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await RefreshToken.deleteMany({ expiresAt: { $lt: now } });
    await PasswordResetToken.deleteMany({ expiresAt: { $lt: now } });
  }
}
