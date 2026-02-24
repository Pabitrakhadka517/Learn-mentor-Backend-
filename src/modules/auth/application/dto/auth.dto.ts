import { z } from 'zod';

/**
 * Registration DTO Schema with enhanced validation
 */
export const RegisterDTOSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .max(320, 'Email is too long')
    .transform(email => email.toLowerCase().trim()),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#]/, 'Password must contain at least one special character'),
    
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces')
    .transform(name => name.trim()),
    
  phone: z.string()
    .optional()
    .refine(phone => {
      if (!phone) return true;
      const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
      return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
    }, 'Invalid phone number format'),
    
  role: z.enum(['STUDENT', 'TUTOR'])
    .default('STUDENT')
});

export type RegisterDTO = z.infer<typeof RegisterDTOSchema>;

/**
 * Login DTO Schema
 */
export const LoginDTOSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform(email => email.toLowerCase().trim()),
    
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long')
});

export type LoginDTO = z.infer<typeof LoginDTOSchema>;

/**
 * Refresh Token DTO Schema
 */
export const RefreshTokenDTOSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required')
    .max(500, 'Invalid refresh token format')
});

export type RefreshTokenDTO = z.infer<typeof RefreshTokenDTOSchema>;

/**
 * Forgot Password DTO Schema
 */
export const ForgotPasswordDTOSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform(email => email.toLowerCase().trim())
});

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordDTOSchema>;

/**
 * Reset Password DTO Schema
 */
export const ResetPasswordDTOSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required')
    .max(500, 'Invalid reset token'),
    
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#]/, 'Password must contain at least one special character')
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordDTOSchema>;

/**
 * Response DTOs
 */
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
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterResponseDTO {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: UserResponseDTO;
}

export interface LoginResponseDTO {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: UserResponseDTO;
}

export interface RefreshResponseDTO {
  message: string;
  accessToken: string;
}

export interface MessageResponseDTO {
  message: string;
}

/**
 * Token Payload Interface
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Rate Limiting DTO
 */
export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

/**
 * Authentication Context DTO
 */
export interface AuthContextDTO {
  user: UserResponseDTO;
  permissions: string[];
  tokenInfo: {
    accessToken: string;
    expiresAt: Date;
    issuedAt: Date;
  };
}