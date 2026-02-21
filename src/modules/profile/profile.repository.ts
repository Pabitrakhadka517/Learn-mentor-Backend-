import { User, IUser } from '../auth/user.model';
import bcrypt from 'bcrypt';

export class ProfileRepository {
    /**
     * Find user by ID
     */
    static async findById(userId: string): Promise<IUser | null> {
        return await User.findById(userId).select('-passwordHash -refreshTokenHash');
    }

    /**
     * Find user by ID with password hash (for password verification)
     */
    static async findByIdWithPassword(userId: string): Promise<IUser | null> {
        return await User.findById(userId);
    }

    /**
     * Update user profile
     */
    static async updateProfile(
        userId: string,
        updates: Partial<IUser>
    ): Promise<IUser | null> {
        return await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-passwordHash -refreshTokenHash');
    }

    /**
     * Update user password
     */
    static async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
        await User.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });
    }

    /**
     * Verify password
     */
    static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Hash password
     */
    static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    /**
     * Delete profile image
     */
    static async deleteProfileImage(userId: string): Promise<IUser | null> {
        return await User.findByIdAndUpdate(
            userId,
            { $unset: { profileImage: 1 } },
            { new: true }
        ).select('-passwordHash -refreshTokenHash');
    }
}
