import { UserEntity } from '../entities/user.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { UserRole } from '../entities/user.entity';

/**
 * Authentication Repository Interface
 * Defines contract for persistence operations
 */
export interface IAuthRepository {
  // User operations
  emailExists(email: string): Promise<boolean>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  createUser(user: UserEntity): Promise<UserEntity>;
  updateUser(id: string, updates: Partial<UserEntity>): Promise<UserEntity>;
  deleteUser(id: string): Promise<void>;
  
  // Password operations
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  
  // Refresh token operations
  storeRefreshToken(token: RefreshTokenEntity): Promise<void>;
  findRefreshToken(userId: string, tokenHash: string): Promise<RefreshTokenEntity | null>;
  deleteRefreshToken(userId: string, tokenHash: string): Promise<void>;
  deleteAllUserRefreshTokens(userId: string): Promise<void>;
  cleanupExpiredTokens(): Promise<number>;
  
  // Password reset operations
  storePasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findPasswordResetToken(tokenHash: string): Promise<{
    userId: string;
    expiresAt: Date;
    used: boolean;
  } | null>;
  markPasswordResetTokenUsed(tokenHash: string): Promise<void>;
  
  // Admin operations
  getUsersByRole(role: UserRole): Promise<UserEntity[]>;
  getUserCount(): Promise<number>;
  getActiveUserCount(): Promise<number>;
  getUsersCreatedAfter(date: Date): Promise<UserEntity[]>;
}