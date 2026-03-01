"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const auth_repository_1 = require("./auth.repository");
const email_service_1 = require("../notification/email.service");
const jwt_1 = require("../../config/jwt");
const auth_dto_1 = require("./auth.dto");
class AuthService {
    static normalizeRole(rawRole) {
        const normalized = (rawRole || 'STUDENT').toString().trim().toUpperCase();
        if (normalized === 'TUTOR')
            return 'TUTOR';
        if (normalized === 'ADMIN')
            return 'ADMIN';
        if (normalized === 'USER')
            return 'STUDENT';
        return 'STUDENT';
    }
    static async register(dto) {
        const validated = auth_dto_1.RegisterDTOSchema.parse(dto);
        if (validated.role === 'ADMIN') {
            throw new Error('Admin accounts cannot be created via public registration');
        }
        const emailExists = await auth_repository_1.AuthRepository.emailExists(validated.email);
        if (emailExists) {
            throw new Error('Email already exists');
        }
        const passwordHash = await auth_repository_1.AuthRepository.hashPassword(validated.password);
        const role = validated.role || 'STUDENT';
        const user = await auth_repository_1.AuthRepository.createUser(validated.email, passwordHash, role, validated.fullName, validated.phone);
        const { accessToken, refreshToken } = await this.generateTokens(user._id.toString(), user.role, user.email);
        const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const refreshTokenHash = await auth_repository_1.AuthRepository.hashPassword(refreshToken);
        await auth_repository_1.AuthRepository.storeRefreshToken(user._id.toString(), refreshTokenHash, refreshTokenExpiry);
        let verificationStatus = 'PENDING';
        if (role === 'TUTOR') {
            const { TutorProfile } = require('../tutor/tutor.model');
            await TutorProfile.create({ user: user._id, verificationStatus: 'PENDING' });
        }
        return {
            message: 'User registered successfully',
            accessToken,
            refreshToken,
            user: await this.getUserWithProfile(user._id.toString()),
        };
    }
    static async login(dto) {
        const validated = auth_dto_1.LoginDTOSchema.parse(dto);
        const user = await auth_repository_1.AuthRepository.findByEmail(validated.email);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        if (!user.isActive) {
            throw new Error('Account is deactivated. Please contact support.');
        }
        const isPasswordValid = await auth_repository_1.AuthRepository.verifyPassword(validated.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        const canonicalUserRole = this.normalizeRole(user.role);
        const canonicalExpectedRole = validated.expectedRole
            ? this.normalizeRole(validated.expectedRole)
            : undefined;
        if (canonicalExpectedRole && canonicalUserRole !== canonicalExpectedRole) {
            const roleLabel = validated.expectedRole === 'STUDENT' ? 'Student' : validated.expectedRole === 'TUTOR' ? 'Tutor' : 'Admin';
            const actualLabel = canonicalUserRole === 'STUDENT' ? 'Student' : canonicalUserRole === 'TUTOR' ? 'Tutor' : 'Admin';
            throw Object.assign(new Error(`This account is registered as a ${actualLabel}. Please use the ${actualLabel} login page instead.`), { statusCode: 403 });
        }
        const { accessToken, refreshToken } = await this.generateTokens(user._id.toString(), canonicalUserRole, user.email);
        const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const refreshTokenHash = await auth_repository_1.AuthRepository.hashPassword(refreshToken);
        await auth_repository_1.AuthRepository.storeRefreshToken(user._id.toString(), refreshTokenHash, refreshTokenExpiry);
        return {
            message: 'Logged in successfully',
            accessToken,
            refreshToken,
            user: await this.getUserWithProfile(user._id.toString()),
        };
    }
    static async refreshAccessToken(refreshToken) {
        try {
            const payload = jsonwebtoken_1.default.verify(refreshToken, jwt_1.jwtConfig.refreshSecret);
            const user = await auth_repository_1.AuthRepository.findById(payload.userId);
            if (!user) {
                throw new Error('User not found');
            }
            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }
            const storedToken = await auth_repository_1.AuthRepository.findRefreshTokenByCompare(user._id.toString(), refreshToken);
            if (!storedToken) {
                throw new Error('Invalid refresh token');
            }
            const canonicalRole = this.normalizeRole(user.role);
            const accessToken = jsonwebtoken_1.default.sign({
                userId: user._id.toString(),
                role: canonicalRole,
                email: user.email,
            }, jwt_1.jwtConfig.accessSecret, { expiresIn: jwt_1.jwtConfig.accessExpiry });
            return { accessToken };
        }
        catch (error) {
            throw new Error('Invalid or expired refresh token. Please login again.');
        }
    }
    static async logout(userId) {
        await auth_repository_1.AuthRepository.deleteRefreshToken(userId);
        return { message: 'Logged out successfully' };
    }
    static async forgotPassword(dto) {
        const validated = auth_dto_1.ForgotPasswordDTOSchema.parse(dto);
        const user = await auth_repository_1.AuthRepository.findByEmail(validated.email);
        if (!user) {
            return { message: 'If the email exists, a password reset link has been sent.' };
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenHash = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await auth_repository_1.AuthRepository.createPasswordResetToken(user._id.toString(), resetTokenHash, expiresAt);
        let emailPreviewUrl;
        try {
            emailPreviewUrl = await email_service_1.EmailService.sendPasswordResetEmail(user.email, resetToken);
            console.log('📧 Password reset email sent successfully to:', user.email);
            if (emailPreviewUrl) {
                console.log('📧 Email preview URL:', emailPreviewUrl);
            }
        }
        catch (emailError) {
            console.error('📧 Email sending failed:', emailError.message);
            emailPreviewUrl = undefined;
        }
        const isDev = process.env.NODE_ENV !== 'production';
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const devResetLink = isDev ? `${frontendUrl}/reset-password?token=${resetToken}` : undefined;
        if (isDev) {
            console.log('🔐 Development Reset Link:', devResetLink);
            console.log('🔑 Reset Token:', resetToken);
        }
        return {
            message: 'If the email exists, a password reset link has been sent.',
            ...(isDev && { devResetLink, emailPreviewUrl: emailPreviewUrl || undefined })
        };
    }
    static async resetPassword(dto) {
        const validated = auth_dto_1.ResetPasswordDTOSchema.parse(dto);
        const resetToken = await auth_repository_1.AuthRepository.findPasswordResetToken(validated.token);
        if (!resetToken) {
            throw new Error('Invalid or expired reset token');
        }
        const newPasswordHash = await auth_repository_1.AuthRepository.hashPassword(validated.newPassword);
        await auth_repository_1.AuthRepository.updatePassword(resetToken.userId, newPasswordHash);
        await auth_repository_1.AuthRepository.markResetTokenAsUsed(resetToken._id.toString());
        await auth_repository_1.AuthRepository.deleteRefreshToken(resetToken.userId);
        return { message: 'Password reset successfully. Please login with your new password.' };
    }
    static async generateTokens(userId, role, email) {
        const accessToken = jsonwebtoken_1.default.sign({
            userId,
            role,
            email,
        }, jwt_1.jwtConfig.accessSecret, { expiresIn: jwt_1.jwtConfig.accessExpiry });
        const refreshToken = jsonwebtoken_1.default.sign({
            userId,
        }, jwt_1.jwtConfig.refreshSecret, { expiresIn: jwt_1.jwtConfig.refreshExpiry });
        return { accessToken, refreshToken };
    }
    static async getUserWithProfile(userId) {
        const user = await auth_repository_1.AuthRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const userObj = user.toObject();
        if (user.role === 'TUTOR') {
            const { TutorProfile } = require('../tutor/tutor.model');
            const profile = await TutorProfile.findOne({ user: user._id });
            userObj.verificationStatus = profile?.verificationStatus || 'PENDING';
        }
        return this.mapUserToDTO(userObj);
    }
    static mapUserToDTO(user) {
        return {
            id: user._id?.toString() || user._id,
            email: user.email,
            role: this.normalizeRole(user.role),
            fullName: user.fullName,
            phone: user.phone,
            profileImage: user.profileImage,
            speciality: user.speciality,
            address: user.address,
            theme: user.theme,
            isVerified: user.isVerified,
            verificationStatus: user.verificationStatus,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map