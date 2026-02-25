import { z } from 'zod';

// Registration DTO
export const RegisterDTOSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#]/, 'Password must contain at least one special character'),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['STUDENT', 'TUTOR']).optional().default('STUDENT'),
});

export type RegisterDTO = z.infer<typeof RegisterDTOSchema>;

// Login DTO
export const LoginDTOSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  expectedRole: z.enum(['STUDENT', 'TUTOR', 'ADMIN']).optional(),
});

export type LoginDTO = z.infer<typeof LoginDTOSchema>;

// Refresh Token DTO
export const RefreshTokenDTOSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDTO = z.infer<typeof RefreshTokenDTOSchema>;

// Forgot Password DTO
export const ForgotPasswordDTOSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordDTOSchema>;

// Reset Password DTO
export const ResetPasswordDTOSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#]/, 'Password must contain at least one special character'),
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordDTOSchema>;

// Response DTOs
export interface UserResponseDTO {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  phone?: string;
  profileImage?: string;
  speciality?: string;
  address?: string;
  theme?: 'light' | 'dark' | 'system';
  isVerified: boolean;
  verificationStatus?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponseDTO {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: UserResponseDTO;
}

export interface RegisterResponseDTO {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: UserResponseDTO;
}

export interface RefreshResponseDTO {
  accessToken: string;
}

export interface MessageResponseDTO {
  message: string;
}
