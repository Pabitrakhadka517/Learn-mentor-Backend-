import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ITokenService, IPasswordService } from '../../domain/interfaces/token.service.interface';
import { jwtConfig } from '../../../../config/jwt';
import { TokenPayload } from '../../application/dto/auth.dto';

/**
 * JWT Token Service Implementation
 * Handles JWT token generation, verification, and management
 */
export class TokenService implements ITokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = jwtConfig.accessSecret;
    this.refreshTokenSecret = jwtConfig.refreshSecret;
    this.accessTokenExpiry = jwtConfig.accessExpiry || '15m'; // 15 minutes
    this.refreshTokenExpiry = jwtConfig.refreshExpiry || '7d'; // 7 days
  }

  /**
   * Generates access and refresh token pair
   * Access token: 15 min expiry (short-lived)
   * Refresh token: 7-day expiry (long-lived)
   */
  async generateTokens(userId: string, role: string, email: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const payload: TokenPayload = {
        userId,
        email,
        role
      };

      // Generate access token (short-lived)
      const accessToken = jwt.sign(
        payload,
        this.accessTokenSecret,
        {
          expiresIn: this.accessTokenExpiry as string,
          issuer: 'learnmentor-auth',
          audience: 'learnmentor-app'
        } as jwt.SignOptions
      );

      // Generate refresh token (long-lived)
      const refreshToken = jwt.sign(
        {
          userId,
          email,
          type: 'refresh'
        },
        this.refreshTokenSecret,
        {
          expiresIn: this.refreshTokenExpiry as string,
          issuer: 'learnmentor-auth',
          audience: 'learnmentor-app'
        } as jwt.SignOptions
      );

      return {
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw new Error(`Token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifies and decodes access token
   */
  async verifyAccessToken(token: string): Promise<{
    userId: string;
    role: string;
    email: string;
    iat: number;
    exp: number;
  }> {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'learnmentor-auth',
        audience: 'learnmentor-app'
      }) as any;

      return {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email,
        iat: decoded.iat,
        exp: decoded.exp
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      }
      throw new Error(`Access token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verifies refresh token without decoding (for hash comparison)
   */
  async verifyRefreshToken(token: string): Promise<{
    userId: string;
    email: string;
    iat: number;
    exp: number;
  }> {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'learnmentor-auth',
        audience: 'learnmentor-app'
      }) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        iat: decoded.iat,
        exp: decoded.exp
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      throw new Error(`Refresh token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extracts token from authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Checks if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Gets token expiry time
   */
  getTokenExpiryTime(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  /**
   * Validates JWT signature without checking expiry
   */
  async validateTokenSignature(token: string, isRefreshToken: boolean = false): Promise<boolean> {
    try {
      const secret = isRefreshToken ? this.refreshTokenSecret : this.accessTokenSecret;
      jwt.verify(token, secret, {
        issuer: 'learnmentor-auth',
        audience: 'learnmentor-app',
        ignoreExpiration: true // Only check signature, not expiry
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Password Service Implementation
 * Handles password validation, generation, and security
 */
export class PasswordService implements IPasswordService {
  /**
   * Validates password strength according to business rules
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 8) {
      score += 2;
    }

    if (password.length > 12) {
      score += 1;
    }

    // Character variety checks
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 2;
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 2;
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 2;
    }

    if (!/[@$!%*?&#]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 3;
    }

    // Additional security checks
    if (password.length > 16) {
      score += 2;
    }

    // Check for common patterns
    if (this.hasCommonPatterns(password)) {
      errors.push('Password contains common patterns and is not secure');
      score = Math.max(0, score - 3);
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(10, score) // Max score of 10
    };
  }

  /**
   * Generates secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '@$!%*?&#';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generates password reset token
   */
  generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Checks if password was recently used
   */
  async isPasswordRecentlyUsed(password: string, previousHashes: string[]): Promise<boolean> {
    // This would compare against a list of previous password hashes
    // For security, we'd hash the new password with each previous salt and compare
    // For now, this is a placeholder implementation
    return false;
  }

  /**
   * Checks for common password patterns
   */
  private hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /^password/i,
      /^123456/,
      /^qwerty/i,
      /^admin/i,
      /^letmein/i,
      /(.)\1{3,}/, // Repeated characters (aaaa, 1111, etc.)
      /^(.)(.)\1\2/i, // Pattern like abab
      /012|123|234|345|456|567|678|789/, // Sequential numbers
      /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i // Sequential letters
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }
}