import { User, IUser } from './user.model';
import bcrypt from 'bcrypt';

export class AuthRepository {
  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by ID
   */
  static async findById(userId: string): Promise<IUser | null> {
    return await User.findById(userId);
  }

  /**
   * Create a new user
   */
  static async createUser(
    email: string,
    passwordHash: string,
    role: 'user' | 'admin' | 'tutor' = 'user'
  ): Promise<IUser> {
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role,
    });
    return user;
  }

  /**
   * Update user's refresh token hash
   */
  static async updateRefreshTokenHash(
    userId: string,
    tokenHash: string | null
  ): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      userId,
      { refreshTokenHash: tokenHash },
      { new: true }
    );
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string): Promise<boolean> {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  }

  /**
   * Get user by email (for login)
   */
  static async getUserForLogin(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash'
    );
  }

  /**
   * Verify password
   */
  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Clear user refresh token
   */
  static async clearRefreshToken(userId: string): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      userId,
      { refreshTokenHash: null },
      { new: true }
    );
  }
}
