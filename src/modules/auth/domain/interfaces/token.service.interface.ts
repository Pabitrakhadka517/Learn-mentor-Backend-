/**
 * Token Service Interface
 * Defines contract for JWT token operations
 */
export interface ITokenService {
  /**
   * Generates access and refresh token pair
   */
  generateTokens(userId: string, role: string, email: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;

  /**
   * Verifies and decodes access token
   */
  verifyAccessToken(token: string): Promise<{
    userId: string;
    role: string;
    email: string;
    iat: number;
    exp: number;
  }>;

  /**
   * Verifies refresh token without decoding (for hash comparison)
   */
  verifyRefreshToken(token: string): Promise<{
    userId: string;
    email: string;
    iat: number;
    exp: number;
  }>;

  /**
   * Extracts token from authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null;

  /**
   * Checks if token is expired
   */
  isTokenExpired(token: string): boolean;

  /**
   * Gets token expiry time
   */
  getTokenExpiryTime(token: string): Date | null;
}

/**
 * Password Service Interface
 * Defines contract for password operations
 */
export interface IPasswordService {
  /**
   * Validates password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  };

  /**
   * Generates secure random password
   */
  generateSecurePassword(length?: number): string;

  /**
   * Generates password reset token
   */
  generateResetToken(): string;

  /**
   * Checks if password was recently used
   */
  isPasswordRecentlyUsed(password: string, previousHashes: string[]): Promise<boolean>;
}