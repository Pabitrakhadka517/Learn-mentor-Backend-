"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenUseCase = void 0;
class RefreshTokenUseCase {
    constructor(authRepository, tokenService) {
        this.authRepository = authRepository;
        this.tokenService = tokenService;
    }
    async execute(dto) {
        try {
            const tokenPayload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
            const refreshTokenHash = await this.authRepository.hashPassword(dto.refreshToken);
            const storedToken = await this.authRepository.findRefreshToken(tokenPayload.userId, refreshTokenHash);
            if (!storedToken) {
                return {
                    success: false,
                    error: 'Refresh token not found or has been revoked',
                    statusCode: 401
                };
            }
            if (storedToken.isExpired()) {
                await this.authRepository.deleteRefreshToken(tokenPayload.userId, refreshTokenHash);
                return {
                    success: false,
                    error: 'Refresh token has expired',
                    statusCode: 401
                };
            }
            const user = await this.authRepository.findById(tokenPayload.userId);
            if (!user) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404
                };
            }
            if (!user.isActive) {
                return {
                    success: false,
                    error: 'User account has been deactivated',
                    statusCode: 403
                };
            }
            const { accessToken } = await this.tokenService.generateTokens(user.id, user.role, user.email);
            return {
                success: true,
                data: {
                    message: 'Access token refreshed successfully',
                    accessToken
                }
            };
        }
        catch (error) {
            console.error('Refresh token use case error:', error);
            if (error instanceof Error) {
                if (error.message.includes('expired')) {
                    return {
                        success: false,
                        error: 'Refresh token has expired',
                        statusCode: 401
                    };
                }
                if (error.message.includes('invalid')) {
                    return {
                        success: false,
                        error: 'Invalid refresh token',
                        statusCode: 401
                    };
                }
            }
            return {
                success: false,
                error: 'Token refresh failed',
                statusCode: 500
            };
        }
    }
}
exports.RefreshTokenUseCase = RefreshTokenUseCase;
//# sourceMappingURL=refresh-token.usecase.js.map