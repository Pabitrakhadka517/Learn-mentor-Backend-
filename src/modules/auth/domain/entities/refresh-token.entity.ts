import { Types } from 'mongoose';

/**
 * RefreshToken Domain Entity
 * Contains business logic for refresh token management
 */
export class RefreshTokenEntity {
  public readonly id?: string;
  public readonly userId: string;
  public readonly tokenHash: string;
  public readonly expiresAt: Date;
  public readonly createdAt: Date;

  constructor(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    createdAt?: Date,
    id?: string
  ) {
    this.validateUserId(userId);
    this.validateTokenHash(tokenHash);
    this.validateExpiryDate(expiresAt);

    this.userId = userId;
    this.tokenHash = tokenHash;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt || new Date();
    this.id = id;
  }

  /**
   * Validates user ID format
   */
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }
  }

  /**
   * Validates token hash format
   */
  private validateTokenHash(tokenHash: string): void {
    if (!tokenHash || typeof tokenHash !== 'string') {
      throw new Error('Token hash is required');
    }

    // bcrypt hash should be 60 characters
    if (tokenHash.length !== 60) {
      throw new Error('Invalid token hash format');
    }
  }

  /**
   * Validates expiry date
   */
  private validateExpiryDate(expiresAt: Date): void {
    if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
      throw new Error('Invalid expiry date');
    }

    if (expiresAt <= new Date()) {
      throw new Error('Token expiry date must be in the future');
    }

    // Max expiry of 30 days
    const maxExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (expiresAt > maxExpiryDate) {
      throw new Error('Token expiry date cannot exceed 30 days');
    }
  }

  /**
   * Checks if token is expired
   */
  public isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  /**
   * Checks if token is about to expire (within 24 hours)
   */
  public isAboutToExpire(): boolean {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return this.expiresAt.getTime() - new Date().getTime() <= twentyFourHours;
  }

  /**
   * Gets remaining time in milliseconds
   */
  public getRemainingTime(): number {
    return Math.max(0, this.expiresAt.getTime() - new Date().getTime());
  }

  /**
   * Creates a new token with extended expiry
   */
  public static createWithExpiry(userId: string, tokenHash: string, daysToExpire: number = 7): RefreshTokenEntity {
    const expiresAt = new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000);
    return new RefreshTokenEntity(userId, tokenHash, expiresAt);
  }
}