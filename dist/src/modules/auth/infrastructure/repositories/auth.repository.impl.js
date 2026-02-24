"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepositoryImpl = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = require("mongoose");
const user_model_1 = require("../../user.model");
const user_entity_1 = require("../../domain/entities/user.entity");
const refresh_token_entity_1 = require("../../domain/entities/refresh-token.entity");
const jwt_1 = require("../../../../config/jwt");
class AuthRepositoryImpl {
    constructor() {
        this.saltRounds = jwt_1.bcryptConfig?.saltRounds || 10;
    }
    async hashPassword(password) {
        try {
            return await bcryptjs_1.default.hash(password, this.saltRounds);
        }
        catch (error) {
            throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async verifyPassword(password, hash) {
        try {
            return await bcryptjs_1.default.compare(password, hash);
        }
        catch (error) {
            console.error('Password verification error:', error);
            return false;
        }
    }
    async emailExists(email) {
        try {
            const user = await user_model_1.User.findOne({ email: email.toLowerCase() }).lean();
            return !!user;
        }
        catch (error) {
            throw new Error(`Email existence check failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async findByEmail(email) {
        try {
            const user = await user_model_1.User.findOne({ email: email.toLowerCase() }).lean();
            return user ? this.mapToEntity(user) : null;
        }
        catch (error) {
            throw new Error(`User lookup failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async findById(id) {
        try {
            const objectId = new mongoose_1.Types.ObjectId(id);
            const user = await user_model_1.User.findById(objectId).lean();
            return user ? this.mapToEntity(user) : null;
        }
        catch (error) {
            throw new Error(`User lookup failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async createUser(userEntity) {
        try {
            const user = new user_model_1.User({
                email: userEntity.email,
                passwordHash: userEntity.passwordHash,
                role: userEntity.role,
                fullName: userEntity.fullName,
                phone: userEntity.phone,
                isVerified: userEntity.isVerified,
                isActive: userEntity.isActive,
                profileImage: userEntity.profileImage,
                speciality: userEntity.speciality,
                address: userEntity.address,
                balance: userEntity.balance,
                theme: userEntity.theme,
                location: userEntity.location
            });
            const saved = await user.save();
            return this.mapToEntity(saved.toObject());
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('duplicate key')) {
                throw new Error('Email already exists');
            }
            throw new Error(`User creation failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async updateUser(id, updates) {
        try {
            const objectId = new mongoose_1.Types.ObjectId(id);
            const updateData = this.mapToMongoUpdate(updates);
            const user = await user_model_1.User.findByIdAndUpdate(objectId, { ...updateData, updatedAt: new Date() }, { new: true, lean: true });
            if (!user) {
                throw new Error('User not found');
            }
            return this.mapToEntity(user);
        }
        catch (error) {
            throw new Error(`User update failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async deleteUser(id) {
        try {
            const objectId = new mongoose_1.Types.ObjectId(id);
            const result = await user_model_1.User.deleteOne({ _id: objectId });
            if (result.deletedCount === 0) {
                throw new Error('User not found');
            }
        }
        catch (error) {
            throw new Error(`User deletion failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async storeRefreshToken(tokenEntity) {
        try {
            const refreshToken = new user_model_1.RefreshToken({
                userId: tokenEntity.userId,
                tokenHash: tokenEntity.tokenHash,
                expiresAt: tokenEntity.expiresAt
            });
            await refreshToken.save();
        }
        catch (error) {
            throw new Error(`Refresh token storage failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async findRefreshToken(userId, tokenHash) {
        try {
            const token = await user_model_1.RefreshToken.findOne({
                userId,
                tokenHash
            }).lean();
            return token ? this.mapToRefreshTokenEntity(token) : null;
        }
        catch (error) {
            throw new Error(`Refresh token lookup failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async deleteRefreshToken(userId, tokenHash) {
        try {
            await user_model_1.RefreshToken.deleteOne({
                userId,
                tokenHash
            });
        }
        catch (error) {
            throw new Error(`Refresh token deletion failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async deleteAllUserRefreshTokens(userId) {
        try {
            await user_model_1.RefreshToken.deleteMany({ userId });
        }
        catch (error) {
            throw new Error(`User refresh tokens deletion failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async cleanupExpiredTokens() {
        try {
            const result = await user_model_1.RefreshToken.deleteMany({
                expiresAt: { $lt: new Date() }
            });
            return result.deletedCount || 0;
        }
        catch (error) {
            console.error('Token cleanup error:', error);
            return 0;
        }
    }
    async storePasswordResetToken(userId, tokenHash, expiresAt) {
        try {
            const resetToken = new user_model_1.PasswordResetToken({
                userId,
                tokenHash,
                expiresAt,
                used: false
            });
            await resetToken.save();
        }
        catch (error) {
            throw new Error(`Password reset token storage failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async findPasswordResetToken(tokenHash) {
        try {
            const token = await user_model_1.PasswordResetToken.findOne({
                tokenHash,
                expiresAt: { $gt: new Date() }
            }).lean();
            return token ? {
                userId: token.userId,
                expiresAt: token.expiresAt,
                used: token.used
            } : null;
        }
        catch (error) {
            throw new Error(`Password reset token lookup failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async markPasswordResetTokenUsed(tokenHash) {
        try {
            await user_model_1.PasswordResetToken.updateOne({ tokenHash }, { used: true, updatedAt: new Date() });
        }
        catch (error) {
            throw new Error(`Password reset token update failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async getUsersByRole(role) {
        try {
            const users = await user_model_1.User.find({ role }).lean();
            return users.map(user => this.mapToEntity(user));
        }
        catch (error) {
            throw new Error(`Users by role lookup failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async getUserCount() {
        try {
            return await user_model_1.User.countDocuments();
        }
        catch (error) {
            throw new Error(`User count failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async getActiveUserCount() {
        try {
            return await user_model_1.User.countDocuments({ isActive: true });
        }
        catch (error) {
            throw new Error(`Active user count failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async getUsersCreatedAfter(date) {
        try {
            const users = await user_model_1.User.find({
                createdAt: { $gte: date }
            }).lean();
            return users.map(user => this.mapToEntity(user));
        }
        catch (error) {
            throw new Error(`Users created after lookup failed: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    mapToEntity(doc) {
        return new user_entity_1.UserEntity(doc.email, doc.passwordHash, doc.role, doc.fullName, doc.phone, doc.isVerified, doc.isActive, doc.balance, doc.theme, doc.profileImage, doc.speciality, doc.address, doc.location, doc.createdAt, doc.updatedAt, doc._id.toString());
    }
    mapToRefreshTokenEntity(doc) {
        return new refresh_token_entity_1.RefreshTokenEntity(doc.userId, doc.tokenHash, doc.expiresAt, doc.createdAt, doc._id.toString());
    }
    mapToMongoUpdate(updates) {
        const mongoUpdate = {};
        if (updates.fullName !== undefined)
            mongoUpdate.fullName = updates.fullName;
        if (updates.phone !== undefined)
            mongoUpdate.phone = updates.phone;
        if (updates.isVerified !== undefined)
            mongoUpdate.isVerified = updates.isVerified;
        if (updates.isActive !== undefined)
            mongoUpdate.isActive = updates.isActive;
        if (updates.profileImage !== undefined)
            mongoUpdate.profileImage = updates.profileImage;
        if (updates.speciality !== undefined)
            mongoUpdate.speciality = updates.speciality;
        if (updates.address !== undefined)
            mongoUpdate.address = updates.address;
        if (updates.balance !== undefined)
            mongoUpdate.balance = updates.balance;
        if (updates.theme !== undefined)
            mongoUpdate.theme = updates.theme;
        if (updates.location !== undefined)
            mongoUpdate.location = updates.location;
        if (updates.passwordHash !== undefined)
            mongoUpdate.passwordHash = updates.passwordHash;
        return mongoUpdate;
    }
}
exports.AuthRepositoryImpl = AuthRepositoryImpl;
//# sourceMappingURL=auth.repository.impl.js.map