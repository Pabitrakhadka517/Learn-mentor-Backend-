"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUseCase = void 0;
const refresh_token_entity_1 = require("../../domain/entities/refresh-token.entity");
class LoginUseCase {
    constructor(authRepository, tokenService) {
        this.authRepository = authRepository;
        this.tokenService = tokenService;
    }
    async execute(dto) {
        try {
            const user = await this.authRepository.findByEmail(dto.email);
            if (!user) {
                return {
                    success: false,
                    error: 'Invalid credentials',
                    statusCode: 401
                };
            }
            if (!user.isActive) {
                return {
                    success: false,
                    error: 'Account has been deactivated. Please contact support.',
                    statusCode: 403
                };
            }
            const isPasswordValid = await this.authRepository.verifyPassword(dto.password, user.passwordHash);
            if (!isPasswordValid) {
                return {
                    success: false,
                    error: 'Invalid credentials',
                    statusCode: 401
                };
            }
            await this.applySecurityRules(user);
            const { accessToken, refreshToken } = await this.tokenService.generateTokens(user.id, user.role, user.email);
            await this.authRepository.deleteAllUserRefreshTokens(user.id);
            const refreshTokenHash = await this.authRepository.hashPassword(refreshToken);
            const refreshTokenEntity = refresh_token_entity_1.RefreshTokenEntity.createWithExpiry(user.id, refreshTokenHash, 7);
            await this.authRepository.storeRefreshToken(refreshTokenEntity);
            const userResponse = {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                phone: user.phone,
                profileImage: user.profileImage,
                speciality: user.speciality,
                address: user.address,
                theme: user.theme,
                isVerified: user.isVerified,
                verificationStatus: this.getVerificationStatus(user),
                isActive: user.isActive,
                balance: user.balance,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
            return {
                success: true,
                data: {
                    message: 'Login successful',
                    accessToken,
                    refreshToken,
                    user: userResponse
                }
            };
        }
        catch (error) {
            console.error('Login use case error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Login failed',
                statusCode: 500
            };
        }
    }
    async applySecurityRules(user) {
        if (user.role === 'ADMIN' && !user.isVerified) {
            throw new Error('Admin account must be verified');
        }
    }
    getVerificationStatus(user) {
        if (user.role === 'TUTOR') {
            return user.isVerified ? 'VERIFIED' : 'PENDING';
        }
        return undefined;
    }
    validateLoginRules(user) {
        if (!user.hasCompleteProfile() && user.role === 'TUTOR') {
            throw new Error('Profile completion required for tutors');
        }
        if (user.role === 'TUTOR' && !user.isVerified) {
            console.log(`Tutor login with pending verification: ${user.id}`);
        }
    }
    async logSecurityEvent(user, event, details) {
        console.log(`Security Event: ${event}`, {
            userId: user.id,
            email: user.email,
            role: user.role,
            timestamp: new Date().toISOString(),
            details
        });
    }
}
exports.LoginUseCase = LoginUseCase;
//# sourceMappingURL=login.usecase.js.map