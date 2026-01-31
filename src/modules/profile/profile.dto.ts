import { z } from 'zod';

/**
 * DTO for updating user profile
 */
export const UpdateProfileDTOSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    phone: z.string().regex(/^[0-9]{10,15}$/, 'Phone number must be 10-15 digits').optional(),
    speciality: z.string().min(2).max(200).optional(),
    address: z.string().min(5).max(500).optional(),
    oldPassword: z.string().min(6).optional(),
    newPassword: z.string().min(6, 'Password must be at least 6 characters').optional()
}).refine(
    (data) => {
        // If newPassword is provided, oldPassword must also be provided
        if (data.newPassword && !data.oldPassword) {
            return false;
        }
        return true;
    },
    {
        message: 'Old password is required when changing password',
        path: ['oldPassword']
    }
);

export type UpdateProfileDTO = z.infer<typeof UpdateProfileDTOSchema>;

/**
 * Response DTO for profile data
 */
export interface ProfileResponseDTO {
    id: string;
    email: string;
    role: string;
    name?: string;
    phone?: string;
    speciality?: string;
    address?: string;
    profileImage?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
