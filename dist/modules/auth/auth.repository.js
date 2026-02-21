"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = require("./user.model");
const jwt_1 = require("../../config/jwt");
class AuthRepository {
    static async hashPassword(password) {
        return bcrypt_1.default.hash(password, jwt_1.bcryptConfig.saltRounds);
    }
    static async verifyPassword(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
    static async emailExists(email) {
        const user = await user_model_1.User.findOne({ email: email.toLowerCase() });
        return !!user;
    }
    static async createUser(email, passwordHash, role, fullName, phone) {
        const user = new user_model_1.User({
            email: email.toLowerCase(),
            passwordHash,
            role,
            fullName,
            phone,
            isVerified: role === 'ADMIN' ? true : false,
            isActive: true,
        });
        return user.save();
    }
    static async findByEmail(email) {
        return user_model_1.User.findOne({ email: email.toLowerCase() });
    }
    static async findById(userId) {
        return user_model_1.User.findById(userId);
    }
    static async storeRefreshToken(userId, tokenHash, expiresAt) {
        await user_model_1.RefreshToken.deleteMany({ userId });
        await user_model_1.RefreshToken.create({
            userId,
            tokenHash,
            expiresAt,
        });
    }
    static async findRefreshToken(userId, tokenHash) {
        return user_model_1.RefreshToken.findOne({
            userId,
            tokenHash,
            expiresAt: { $gt: new Date() },
        });
    }
    static async deleteRefreshToken(userId) {
        await user_model_1.RefreshToken.deleteMany({ userId });
    }
    static async createPasswordResetToken(userId, tokenHash, expiresAt) {
        await user_model_1.PasswordResetToken.updateMany({ userId, used: false }, { used: true });
        await user_model_1.PasswordResetToken.create({
            userId,
            tokenHash,
            expiresAt,
            used: false,
        });
    }
    static async findPasswordResetToken(tokenHash) {
        return user_model_1.PasswordResetToken.findOne({
            tokenHash,
            used: false,
            expiresAt: { $gt: new Date() },
        });
    }
    static async markResetTokenAsUsed(tokenId) {
        await user_model_1.PasswordResetToken.findByIdAndUpdate(tokenId, { used: true });
    }
    static async updatePassword(userId, newPasswordHash) {
        await user_model_1.User.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });
    }
    static async updateVerificationStatus(userId, isVerified) {
        await user_model_1.User.findByIdAndUpdate(userId, { isVerified });
    }
    static async updateActiveStatus(userId, isActive) {
        await user_model_1.User.findByIdAndUpdate(userId, { isActive });
    }
    static async cleanupExpiredTokens() {
        const now = new Date();
        await user_model_1.RefreshToken.deleteMany({ expiresAt: { $lt: now } });
        await user_model_1.PasswordResetToken.deleteMany({ expiresAt: { $lt: now } });
    }
}
exports.AuthRepository = AuthRepository;
//# sourceMappingURL=auth.repository.js.map