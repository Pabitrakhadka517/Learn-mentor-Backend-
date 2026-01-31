import { z } from 'zod';

// Register DTO with Zod validation
export const RegisterDTOSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long")
    .min(1, "Password cannot be empty"),
});

export type RegisterDTO = z.infer<typeof RegisterDTOSchema>;

// Login DTO with Zod validation
export const LoginDTOSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
});

export type LoginDTO = z.infer<typeof LoginDTOSchema>;

// Register with Role DTO
export const RegisterAdminDTOSchema = RegisterDTOSchema.extend({
  role: z.literal('admin').optional(),
});

export type RegisterAdminDTO = z.infer<typeof RegisterAdminDTOSchema>;

export const RegisterUserDTOSchema = RegisterDTOSchema.extend({
  role: z.literal('user').optional(),
});

export type RegisterUserDTO = z.infer<typeof RegisterUserDTOSchema>;

export const RegisterTutorDTOSchema = RegisterDTOSchema.extend({
  role: z.literal('tutor').optional(),
});

export type RegisterTutorDTO = z.infer<typeof RegisterTutorDTOSchema>;

// Login Response DTO
export interface LoginResponseDTO {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
    phone?: string;
    speciality?: string;
    address?: string;
    profileImage?: string;
  };
}

// Validation error response
export interface ValidationErrorDTO {
  field: string;
  message: string;
}

