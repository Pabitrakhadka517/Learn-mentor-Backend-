"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
class AuthController {
    static async register(req, res) {
        try {
            if (!req.body.role) {
                if (req.path.includes('/tutor')) {
                    req.body.role = 'TUTOR';
                }
                else if (req.path.includes('/user')) {
                    req.body.role = 'STUDENT';
                }
            }
            else {
                if (req.body.role === 'user')
                    req.body.role = 'STUDENT';
                if (req.body.role === 'tutor')
                    req.body.role = 'TUTOR';
            }
            const result = await auth_service_1.AuthService.register(req.body);
            res.status(201).json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            res.status(400).json({
                success: false,
                message: error.message || 'Registration failed',
            });
        }
    }
    static async login(req, res) {
        try {
            if (req.body.expectedRole) {
                const roleMap = {
                    USER: 'STUDENT',
                    student: 'STUDENT', user: 'STUDENT', STUDENT: 'STUDENT',
                    tutor: 'TUTOR', TUTOR: 'TUTOR',
                    admin: 'ADMIN', ADMIN: 'ADMIN',
                };
                req.body.expectedRole = roleMap[req.body.expectedRole] || req.body.expectedRole;
            }
            const result = await auth_service_1.AuthService.login(req.body);
            res.status(200).json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            if (error.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            const statusCode = error.statusCode || 401;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Login failed',
            });
        }
    }
    static async refresh(req, res) {
        try {
            let { refreshToken } = req.body;
            if (!refreshToken && req.headers.authorization?.startsWith('Bearer ')) {
                refreshToken = req.headers.authorization.split(' ')[1];
            }
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token is required',
                });
            }
            const result = await auth_service_1.AuthService.refreshAccessToken(refreshToken);
            res.status(200).json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                message: error.message || 'Token refresh failed',
            });
        }
    }
    static async logout(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated',
                });
            }
            const result = await auth_service_1.AuthService.logout(req.user.userId);
            res.status(200).json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Logout failed',
            });
        }
    }
    static async forgotPassword(req, res) {
        try {
            const result = await auth_service_1.AuthService.forgotPassword(req.body);
            res.status(200).json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            console.error('Forgot password error:', error);
            if (error.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            if (error.message.includes('Email') || error.message.includes('SMTP')) {
                console.warn('Email service error, but continuing:', error.message);
                return res.status(200).json({
                    success: true,
                    message: 'If the email exists, a password reset link has been sent.',
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to process password reset request. Please try again later.',
            });
        }
    }
    static async resetPassword(req, res) {
        try {
            const result = await auth_service_1.AuthService.resetPassword(req.body);
            res.status(200).json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            console.error('Reset password error:', error);
            if (error.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            let statusCode = 400;
            let message = error.message;
            if (message.includes('Invalid or expired reset token')) {
                statusCode = 400;
                message = 'The reset token is invalid or has expired. Please request a new password reset.';
            }
            else if (message.includes('Password must')) {
                statusCode = 400;
                message = error.message;
            }
            else {
                statusCode = 500;
                message = 'Failed to reset password. Please try again later.';
            }
            res.status(statusCode).json({
                success: false,
                message: message,
            });
        }
    }
    static async getCurrentUser(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated',
                });
            }
            const user = await auth_service_1.AuthService.getUserWithProfile(req.user.userId);
            res.status(200).json({
                success: true,
                user,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get user info',
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map