import { z } from 'zod';

/**
 * DTO for updating user profile
 */
export const UpdateProfileDTOSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    phone: z.string().regex(/^[0-9+]{10,15}$/, 'Phone number must be 10-15 digits').optional(),
    speciality: z.string().min(2).max(200).optional(),
    address: z.string().min(5).max(500).optional(),
    bio: z.string().max(2000).optional(),
    hourlyRate: z.preprocess((val) => (val ? Number(val) : val), z.number().min(0)).optional(),
    experienceYears: z.preprocess((val) => (val ? Number(val) : val), z.number().min(0)).optional(),
    subjects: z.preprocess((val) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return [val]; }
        }
        return val;
    }, z.array(z.string())).optional(),
    languages: z.preprocess((val) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return [val]; }
        }
        return val;
    }, z.array(z.string())).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    oldPassword: z.string().min(6).optional(),
    newPassword: z.string().min(6, 'Password must be at least 6 characters').optional()
}).refine(
    (data) => {
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
    // Tutor specific fields
    bio?: string;
    hourlyRate?: number;
    experienceYears?: number;
    subjects?: string[];
    languages?: string[];
    theme?: 'light' | 'dark' | 'system';
    verificationStatus?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
