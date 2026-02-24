"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUseCase = void 0;
const user_entity_1 = require("../../domain/entities/user.entity");
const refresh_token_entity_1 = require("../../domain/entities/refresh-token.entity");
class RegisterUseCase {
    constructor(authRepository, tokenService) {
        this.authRepository = authRepository;
        this.tokenService = tokenService;
    }
    async execute(dto) {
        try {
            const emailExists = await this.authRepository.emailExists(dto.email);
            if (emailExists) {
                return {
                    success: false,
                    error: 'Email already exists'
                };
            }
            const passwordHash = await this.authRepository.hashPassword(dto.password);
            const userEntity = new user_entity_1.UserEntity(dto.email, passwordHash, dto.role || 'STUDENT', dto.fullName, dto.phone, false, true, 0, 'system');
            const createdUser = await this.authRepository.createUser(userEntity);
            const { accessToken, refreshToken } = await this.tokenService.generateTokens(createdUser.id, createdUser.role, createdUser.email);
            const refreshTokenHash = await this.authRepository.hashPassword(refreshToken);
            const refreshTokenEntity = refresh_token_entity_1.RefreshTokenEntity.createWithExpiry(createdUser.id, refreshTokenHash, 7);
            await this.authRepository.storeRefreshToken(refreshTokenEntity);
            if (createdUser.role === 'TUTOR') {
                console.log(`Created TUTOR user: ${createdUser.id}, profile creation needed`);
            }
            const userResponse = {
                id: createdUser.id,
                email: createdUser.email,
                role: createdUser.role,
                fullName: createdUser.fullName,
                phone: createdUser.phone,
                profileImage: createdUser.profileImage,
                speciality: createdUser.speciality,
                address: createdUser.address,
                theme: createdUser.theme,
                isVerified: createdUser.isVerified,
                verificationStatus: createdUser.role === 'TUTOR' ? 'PENDING' : undefined,
                isActive: createdUser.isActive,
                balance: createdUser.balance,
                createdAt: createdUser.createdAt,
                updatedAt: createdUser.updatedAt
            };
            return {
                success: true,
                data: {
                    message: 'User registered successfully',
                    accessToken,
                    refreshToken,
                    user: userResponse
                }
            };
        }
        catch (error) {
            console.error('Registration use case error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Registration failed'
            };
        }
    }
    validateBusinessRules(dto) {
        if (dto.role && !['STUDENT', 'TUTOR'].includes(dto.role)) {
            throw new Error('Invalid role for public registration');
        }
        const emailDomain = dto.email.split('@')[1];
        const blockedDomains = ['tempmail.com', '10minutemail.com'];
        if (blockedDomains.includes(emailDomain)) {
            throw new Error('Email domain is not allowed');
        }
    }
    async applyPostCreationLogic(user) {
    }
}
exports.RegisterUseCase = RegisterUseCase;
//# sourceMappingURL=register.usecase.js.map