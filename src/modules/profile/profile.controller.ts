import { Request, Response } from 'express';
import { ProfileService } from './profile.service';
import { z } from 'zod';

/**
 * Handle Zod validation errors
 */
const handleValidationError = (error: any, res: Response) => {
    if (error instanceof z.ZodError) {
        const errors = error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
        }));
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }
    return false;
};

export class ProfileController {
    /**
     * Get current user's profile
     */
    static async getProfile(req: any, res: Response) {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const profile = await ProfileService.getProfile(req.user.userId);
            res.status(200).json(profile);
        } catch (error: any) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }

    /**
     * Update user profile
     * Handles: name, phone, speciality, address, profileImage, password change
     */
    static async updateProfile(req: any, res: Response) {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Extract file if uploaded
            const file = req.file;

            // Update profile with optional image
            console.log('Update Data:', req.body);
            console.log('File:', !!file);
            const updatedProfile = await ProfileService.updateProfile(
                req.user.userId,
                req.body,
                file
            );

            res.status(200).json({
                message: 'Profile updated successfully',
                profile: updatedProfile
            });
        } catch (error: any) {
            if (handleValidationError(error, res)) return;

            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            }

            if (error.message === 'Current password is incorrect') {
                return res.status(400).json({ error: error.message });
            }

            if (error.message.includes('Image upload failed')) {
                return res.status(500).json({ error: error.message });
            }

            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }

    /**
     * Update user theme preference
     */
    static async updateTheme(req: any, res: Response) {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const ThemeUpdateSchema = z.object({
                theme: z.enum(['light', 'dark', 'system'], {
                    errorMap: () => ({ message: 'Theme must be light, dark, or system' })
                })
            });

            const validationResult = ThemeUpdateSchema.safeParse(req.body);
            if (!validationResult.success) {
                return handleValidationError(validationResult.error, res);
            }

            const { theme } = validationResult.data;
            const updatedProfile = await ProfileService.updateTheme(req.user.userId, theme);

            res.status(200).json({
                message: 'Theme preference updated successfully',
                profile: updatedProfile
            });
        } catch (error: any) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            }

            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }

    /**
     * Delete profile image
     */
    static async deleteProfileImage(req: any, res: Response) {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const updatedProfile = await ProfileService.deleteProfileImage(req.user.userId);

            res.status(200).json({
                message: 'Profile image deleted successfully',
                profile: updatedProfile
            });
        } catch (error: any) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            }

            if (error.message === 'No profile image to delete') {
                return res.status(400).json({ error: error.message });
            }

            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
}
