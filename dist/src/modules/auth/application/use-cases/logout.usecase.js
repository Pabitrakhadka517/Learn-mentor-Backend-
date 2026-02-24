"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoutUseCase = void 0;
class LogoutUseCase {
    constructor(authRepository, tokenService) {
        this.authRepository = authRepository;
        this.tokenService = tokenService;
    }
    async execute(accessToken) {
        try {
            const tokenPayload = await this.tokenService.verifyAccessToken(accessToken);
            await this.authRepository.deleteAllUserRefreshTokens(tokenPayload.userId);
            console.log('User logout', {
                userId: tokenPayload.userId,
                email: tokenPayload.email,
                timestamp: new Date().toISOString()
            });
            return {
                success: true,
                data: {
                    message: 'Logged out successfully'
                }
            };
        }
        catch (error) {
            console.error('Logout use case error:', error);
            if (error instanceof Error) {
                if (error.message.includes('expired')) {
                    return {
                        success: true,
                        data: {
                            message: 'Logged out successfully'
                        }
                    };
                }
                if (error.message.includes('invalid')) {
                    return {
                        success: false,
                        error: 'Invalid access token',
                        statusCode: 401
                    };
                }
            }
            return {
                success: false,
                error: 'Logout failed',
                statusCode: 500
            };
        }
    }
    async executeFromDevice(refreshToken) {
        try {
            const tokenPayload = await this.tokenService.verifyRefreshToken(refreshToken);
            const refreshTokenHash = await this.authRepository.hashPassword(refreshToken);
            await this.authRepository.deleteRefreshToken(tokenPayload.userId, refreshTokenHash);
            return {
                success: true,
                data: {
                    message: 'Logged out from current device successfully'
                }
            };
        }
        catch (error) {
            console.error('Device logout use case error:', error);
            return {
                success: false,
                error: 'Device logout failed',
                statusCode: 500
            };
        }
    }
}
exports.LogoutUseCase = LogoutUseCase;
//# sourceMappingURL=logout.usecase.js.map