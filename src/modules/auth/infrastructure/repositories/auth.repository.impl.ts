import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User, RefreshToken, PasswordResetToken, IUser, UserRole } from '../../user.model';
import { IAuthRepository } from '../../domain/interfaces/auth.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { RefreshTokenEntity } from '../../domain/entities/refresh-token.entity';
import { bcryptConfig } from '../../../../config/jwt';

/**
 * MongoDB implementation of Authentication Repository
 * Handles all database operations for authentication
 */
export class AuthRepositoryImpl implements IAuthRepository {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = bcryptConfig?.saltRounds || 10;
  }

  /**
   * Hash password using bcrypt with configured salt rounds
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify password against hash using bcrypt
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Check if email exists in database
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() }).lean();
      return !!user;
    } catch (error) {
      throw new Error(`Email existence check failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() }).lean();
      return user ? this.mapToEntity(user) : null;
    } catch (error) {
      throw new Error(`User lookup failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserEntity | null> {
    try {
      const objectId = new Types.ObjectId(id);
      const user = await User.findById(objectId).lean();
      return user ? this.mapToEntity(user) : null;
    } catch (error) {
      throw new Error(`User lookup failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Create a new user
   */
  async createUser(userEntity: UserEntity): Promise<UserEntity> {
    try {
      const user = new User({
        email: userEntity.email,
        passwordHash: userEntity.passwordHash,
        role: userEntity.role,
        fullName: userEntity.fullName,
        phone: userEntity.phone,
        isVerified: userEntity.isVerified,
        isActive: userEntity.isActive,
        profileImage: userEntity.profileImage,
        speciality: userEntity.speciality,
        address: userEntity.address,
        balance: userEntity.balance,
        theme: userEntity.theme,
        location: userEntity.location
      });

      const saved = await user.save();
      return this.mapToEntity(saved.toObject());
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('Email already exists');
      }
      throw new Error(`User creation failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: Partial<UserEntity>): Promise<UserEntity> {
    try {
      const objectId = new Types.ObjectId(id);
      const updateData = this.mapToMongoUpdate(updates);
      
      const user = await User.findByIdAndUpdate(
        objectId,
        { ...updateData, updatedAt: new Date() },
        { new: true, lean: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return this.mapToEntity(user);
    } catch (error) {
      throw new Error(`User update failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const objectId = new Types.ObjectId(id);
      const result = await User.deleteOne({ _id: objectId });
      
      if (result.deletedCount === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      throw new Error(`User deletion failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(tokenEntity: RefreshTokenEntity): Promise<void> {
    try {
      const refreshToken = new RefreshToken({
        userId: tokenEntity.userId,
        tokenHash: tokenEntity.tokenHash,
        expiresAt: tokenEntity.expiresAt
      });

      await refreshToken.save();
    } catch (error) {
      throw new Error(`Refresh token storage failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Find refresh token
   */
  async findRefreshToken(userId: string, tokenHash: string): Promise<RefreshTokenEntity | null> {
    try {
      const token = await RefreshToken.findOne({
        userId,
        tokenHash
      }).lean();

      return token ? this.mapToRefreshTokenEntity(token) : null;
    } catch (error) {
      throw new Error(`Refresh token lookup failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Delete specific refresh token
   */
  async deleteRefreshToken(userId: string, tokenHash: string): Promise<void> {
    try {
      await RefreshToken.deleteOne({
        userId,
        tokenHash
      });
    } catch (error) {
      throw new Error(`Refresh token deletion failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Delete all refresh tokens for a user
   */
  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    try {
      await RefreshToken.deleteMany({ userId });
    } catch (error) {
      throw new Error(`User refresh tokens deletion failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await RefreshToken.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Token cleanup error:', error);
      return 0;
    }
  }

  /**
   * Store password reset token
   */
  async storePasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    try {
      const resetToken = new PasswordResetToken({
        userId,
        tokenHash,
        expiresAt,
        used: false
      });

      await resetToken.save();
    } catch (error) {
      throw new Error(`Password reset token storage failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Find password reset token
   */
  async findPasswordResetToken(tokenHash: string): Promise<{
    userId: string;
    expiresAt: Date;
    used: boolean;
  } | null> {
    try {
      const token = await PasswordResetToken.findOne({
        tokenHash,
        expiresAt: { $gt: new Date() }
      }).lean();

      return token ? {
        userId: token.userId,
        expiresAt: token.expiresAt,
        used: token.used
      } : null;
    } catch (error) {
      throw new Error(`Password reset token lookup failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Mark password reset token as used
   */
  async markPasswordResetTokenUsed(tokenHash: string): Promise<void> {
    try {
      await PasswordResetToken.updateOne(
        { tokenHash },
        { used: true, updatedAt: new Date() }
      );
    } catch (error) {
      throw new Error(`Password reset token update failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole): Promise<UserEntity[]> {
    try {
      const users = await User.find({ role }).lean();
      return users.map(user => this.mapToEntity(user));
    } catch (error) {
      throw new Error(`Users by role lookup failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Get total user count
   */
  async getUserCount(): Promise<number> {
    try {
      return await User.countDocuments();
    } catch (error) {
      throw new Error(`User count failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Get active user count
   */
  async getActiveUserCount(): Promise<number> {
    try {
      return await User.countDocuments({ isActive: true });
    } catch (error) {
      throw new Error(`Active user count failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Get users created after a specific date
   */
  async getUsersCreatedAfter(date: Date): Promise<UserEntity[]> {
    try {
      const users = await User.find({
        createdAt: { $gte: date }
      }).lean();
      return users.map(user => this.mapToEntity(user));
    } catch (error) {
      throw new Error(`Users created after lookup failed: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Maps MongoDB document to UserEntity
   */
  private mapToEntity(doc: any): UserEntity {
    return new UserEntity(
      doc.email,
      doc.passwordHash,
      doc.role,
      doc.fullName,
      doc.phone,
      doc.isVerified,
      doc.isActive,
      doc.balance,
      doc.theme,
      doc.profileImage,
      doc.speciality,
      doc.address,
      doc.location,
      doc.createdAt,
      doc.updatedAt,
      doc._id.toString()
    );
  }

  /**
   * Maps refresh token document to entity
   */
  private mapToRefreshTokenEntity(doc: any): RefreshTokenEntity {
    return new RefreshTokenEntity(
      doc.userId,
      doc.tokenHash,
      doc.expiresAt,
      doc.createdAt,
      doc._id.toString()
    );
  }

  /**
   * Maps entity updates to MongoDB update object
   */
  private mapToMongoUpdate(updates: Partial<UserEntity>): any {
    const mongoUpdate: any = {};
    
    if (updates.fullName !== undefined) mongoUpdate.fullName = updates.fullName;
    if (updates.phone !== undefined) mongoUpdate.phone = updates.phone;
    if (updates.isVerified !== undefined) mongoUpdate.isVerified = updates.isVerified;
    if (updates.isActive !== undefined) mongoUpdate.isActive = updates.isActive;
    if (updates.profileImage !== undefined) mongoUpdate.profileImage = updates.profileImage;
    if (updates.speciality !== undefined) mongoUpdate.speciality = updates.speciality;
    if (updates.address !== undefined) mongoUpdate.address = updates.address;
    if (updates.balance !== undefined) mongoUpdate.balance = updates.balance;
    if (updates.theme !== undefined) mongoUpdate.theme = updates.theme;
    if (updates.location !== undefined) mongoUpdate.location = updates.location;
    if (updates.passwordHash !== undefined) mongoUpdate.passwordHash = updates.passwordHash;
    
    return mongoUpdate;
  }
}