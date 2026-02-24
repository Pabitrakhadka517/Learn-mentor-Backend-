"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthControllerClean = void 0;
const auth_dto_1 = require("../../application/dto/auth.dto");
class AuthControllerClean {
    constructor(registerUseCase, loginUseCase) {
        this.registerUseCase = registerUseCase;
        this.loginUseCase = loginUseCase;
    }
    async register(req, res) {
        try {
            const validationResult = auth_dto_1.RegisterDTOSchema.safeParse(req.body);
            if (!validationResult.success) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationResult.error.errors.map(error => ({
                        field: error.path.join('.'),
                        message: error.message
                    }))
                });
                return;
            }
            const dto = validationResult.data;
            if (!dto.role) {
                if (req.path.includes('/tutor')) {
                    dto.role = 'TUTOR';
                }
                else if (req.path.includes('/student') || req.path.includes('/user')) {
                    dto.role = 'STUDENT';
                }
                else {
                    dto.role = 'STUDENT';
                }
            }
            const result = await this.registerUseCase.execute(dto);
            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: result.data.message,
                    accessToken: result.data.accessToken,
                    refreshToken: result.data.refreshToken,
                    user: result.data.user
                });
            }
            else {
                const statusCode = this.getErrorStatusCode(result.error);
                res.status(statusCode).json({
                    success: false,
                    message: result.error
                });
            }
        }
        catch (error) {
            console.error('Registration controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during registration'
            });
        }
    }
    async login(req, res) {
        try {
            const validationResult = auth_dto_1.LoginDTOSchema.safeParse(req.body);
            if (!validationResult.success) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationResult.error.errors.map(error => ({
                        field: error.path.join('.'),
                        message: error.message
                    }))
                });
                return;
            }
            const dto = validationResult.data;
            const result = await this.loginUseCase.execute(dto);
            if (result.success) {
                res.status(200).json({
                    success: true,
                    message: result.data.message,
                    accessToken: result.data.accessToken,
                    refreshToken: result.data.refreshToken,
                    user: result.data.user
                });
            }
            else {
                const statusCode = result.statusCode || this.getErrorStatusCode(result.error);
                res.status(statusCode).json({
                    success: false,
                    message: result.error
                });
            }
        }
        catch (error) {
            console.error('Login controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during login'
            });
        }
    }
    async refresh(req, res) {
        try {
            let refreshToken = req.body.refreshToken;
            if (!refreshToken && req.headers.authorization?.startsWith('Bearer ')) {
                refreshToken = req.headers.authorization.split(' ')[1];
            }
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    message: 'Refresh token is required'
                });
                return;
            }
            res.status(501).json({
                success: false,
                message: 'Token refresh not implemented yet'
            });
        }
        catch (error) {
            console.error('Token refresh controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during token refresh'
            });
        }
    }
    async logout(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                res.status(401).json({
                    success: false,
                    message: 'No authentication token provided'
                });
                return;
            }
            res.status(501).json({
                success: false,
                message: 'Logout not implemented yet'
            });
        }
        catch (error) {
            console.error('Logout controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during logout'
            });
        }
    }
    async forgotPassword(req, res) {
        try {
            res.status(501).json({
                success: false,
                message: 'Forgot password not implemented yet'
            });
        }
        catch (error) {
            console.error('Forgot password controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during password reset request'
            });
        }
    }
    async resetPassword(req, res) {
        try {
            res.status(501).json({
                success: false,
                message: 'Reset password not implemented yet'
            });
        }
        catch (error) {
            console.error('Reset password controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during password reset'
            });
        }
    }
    async getProfile(req, res) {
        try {
            res.status(501).json({
                success: false,
                message: 'Get profile not implemented yet'
            });
        }
        catch (error) {
            console.error('Get profile controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching profile'
            });
        }
    }
    getErrorStatusCode(errorMessage) {
        const errorMap = {
            'email already exists': 409,
            'invalid credentials': 401,
            'account has been deactivated': 403,
            'admin accounts cannot be created': 403,
            'email domain is not allowed': 400,
            'user not found': 404,
            'invalid password': 401,
            'account not verified': 403
        };
        const lowerErrorMessage = errorMessage.toLowerCase();
        for (const [key, statusCode] of Object.entries(errorMap)) {
            if (lowerErrorMessage.includes(key)) {
                return statusCode;
            }
        }
        return 400;
    }
    setRateLimitHeaders(res, limit, current) {
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
        res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + 900);
    }
    logSecurityEvent(event, email, success = true) {
        console.log(`Auth Security Event: ${event}`, {
            email: email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : undefined,
            success,
            timestamp: new Date().toISOString(),
            userAgent: 'request.headers["user-agent"]',
            ip: 'request.ip'
        });
    }
}
exports.AuthControllerClean = AuthControllerClean;
//# sourceMappingURL=auth.controller.clean.js.map