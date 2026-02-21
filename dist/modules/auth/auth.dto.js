"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordDTOSchema = exports.ForgotPasswordDTOSchema = exports.RefreshTokenDTOSchema = exports.LoginDTOSchema = exports.RegisterDTOSchema = void 0;
const zod_1 = require("zod");
exports.RegisterDTOSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[@$!%*?&#]/, 'Password must contain at least one special character'),
    fullName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['STUDENT', 'TUTOR']).optional().default('STUDENT'),
});
exports.LoginDTOSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.RefreshTokenDTOSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.ForgotPasswordDTOSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
});
exports.ResetPasswordDTOSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    newPassword: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[@$!%*?&#]/, 'Password must contain at least one special character'),
});
//# sourceMappingURL=auth.dto.js.map