import { ProfileRepository } from './profile.repository';
import { UpdateProfileDTO, UpdateProfileDTOSchema, ProfileResponseDTO } from './profile.dto';
import cloudinary from '../../config/cloudinary';
import { IUser } from '../auth/user.model';

export class ProfileService {
    /**
     * Get user profile
     */
    static async getProfile(userId: string): Promise<ProfileResponseDTO> {
        const user = await ProfileRepository.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        return this.formatProfileResponse(user);
    }

    /**
     * Update user profile with optional image and password change
     */
    static async updateProfile(
        userId: string,
        dto: UpdateProfileDTO,
        file?: Express.Multer.File
    ): Promise<ProfileResponseDTO> {
        // Validate DTO
        const validated = UpdateProfileDTOSchema.parse(dto);

        // Get user with password hash for verification
        const user = await ProfileRepository.findByIdWithPassword(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Handle password change if requested
        if (validated.newPassword && validated.oldPassword) {
            const isPasswordValid = await ProfileRepository.verifyPassword(
                validated.oldPassword,
                user.passwordHash
            );

            if (!isPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            // Hash and update new password
            const newPasswordHash = await ProfileRepository.hashPassword(validated.newPassword);
            await ProfileRepository.updatePassword(userId, newPasswordHash);
        }

        // Prepare profile updates (excluding password fields)
        const updates: Partial<IUser> = {};

        if (validated.name !== undefined) updates.name = validated.name;
        if (validated.phone !== undefined) updates.phone = validated.phone;
        if (validated.speciality !== undefined) updates.speciality = validated.speciality;
        if (validated.address !== undefined) updates.address = validated.address;

        // Handle image upload to Cloudinary
        if (file) {
            try {
                // Delete old image if exists
                if (user.profileImage) {
                    const publicId = this.extractPublicId(user.profileImage);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                    }
                }

                // Upload new image to Cloudinary
                const result = await new Promise<any>((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'learnmentor/profiles',
                            transformation: [
                                { width: 500, height: 500, crop: 'fill' },
                                { quality: 'auto' }
                            ]
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(file.buffer);
                });

                updates.profileImage = result.secure_url;
            } catch (error: any) {
                throw new Error(`Image upload failed: ${error.message}`);
            }
        }

        // Update profile
        const updatedUser = await ProfileRepository.updateProfile(userId, updates);

        if (!updatedUser) {
            throw new Error('Failed to update profile');
        }

        return this.formatProfileResponse(updatedUser);
    }

    /**
     * Delete profile image
     */
    static async deleteProfileImage(userId: string): Promise<ProfileResponseDTO> {
        const user = await ProfileRepository.findByIdWithPassword(userId);

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.profileImage) {
            throw new Error('No profile image to delete');
        }

        // Delete from Cloudinary
        try {
            const publicId = this.extractPublicId(user.profileImage);
            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        } catch (error: any) {
            console.error('Failed to delete image from Cloudinary:', error);
            // Continue even if Cloudinary deletion fails
        }

        // Remove from database
        const updatedUser = await ProfileRepository.deleteProfileImage(userId);

        if (!updatedUser) {
            throw new Error('Failed to delete profile image');
        }

        return this.formatProfileResponse(updatedUser);
    }

    /**
     * Extract Cloudinary public ID from URL
     */
    private static extractPublicId(url: string): string | null {
        try {
            const matches = url.match(/\/learnmentor\/profiles\/([^/.]+)/);
            return matches ? `learnmentor/profiles/${matches[1]}` : null;
        } catch {
            return null;
        }
    }

    /**
     * Format user object to profile response
     */
    private static formatProfileResponse(user: IUser): ProfileResponseDTO {
        return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            phone: user.phone,
            speciality: user.speciality,
            address: user.address,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
}
