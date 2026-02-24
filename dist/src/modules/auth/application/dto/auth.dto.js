"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordDTOSchema = exports.ForgotPasswordDTOSchema = exports.RefreshTokenDTOSchema = exports.LoginDTOSchema = exports.RegisterDTOSchema = void 0;
const zod_1 = require("zod");
exports.RegisterDTOSchema = zod_1.z.object({
    email: zod_1.z.string()
        .min(1, 'Email is required')
        .email('Invalid email format')
        .max(320, 'Email is too long')
        .transform(email => email.toLowerCase().trim()),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password is too long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[@$!%*?&#]/, 'Password must contain at least one special character'),
    fullName: zod_1.z.string()
        .min(1, 'Full name is required')
        .max(100, 'Full name is too long')
        .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces')
        .transform(name => name.trim()),
    phone: zod_1.z.string()
        .optional()
        .refine(phone => {
        if (!phone)
            return true;
        const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
    }, 'Invalid phone number format'),
    role: zod_1.z.enum(['STUDENT', 'TUTOR'])
        .default('STUDENT')
});
exports.LoginDTOSchema = zod_1.z.object({
    email: zod_1.z.string()
        .min(1, 'Email is required')
        .email('Invalid email format')
        .transform(email => email.toLowerCase().trim()),
    password: zod_1.z.string()
        .min(1, 'Password is required')
        .max(128, 'Password is too long')
});
exports.RefreshTokenDTOSchema = zod_1.z.object({
    refreshToken: zod_1.z.string()
        .min(1, 'Refresh token is required')
        .max(500, 'Invalid refresh token format')
});
exports.ForgotPasswordDTOSchema = zod_1.z.object({
    email: zod_1.z.string()
        .min(1, 'Email is required')
        .email('Invalid email format')
        .transform(email => email.toLowerCase().trim())
});
exports.ResetPasswordDTOSchema = zod_1.z.object({
    token: zod_1.z.string()
        .min(1, 'Reset token is required')
        .max(500, 'Invalid reset token'),
    newPassword: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password is too long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[@$!%*?&#]/, 'Password must contain at least one special character')
});
//# sourceMappingURL=auth.dto.js.map