"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenEntity = void 0;
const mongoose_1 = require("mongoose");
class RefreshTokenEntity {
    constructor(userId, tokenHash, expiresAt, createdAt, id) {
        this.validateUserId(userId);
        this.validateTokenHash(tokenHash);
        this.validateExpiryDate(expiresAt);
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.createdAt = createdAt || new Date();
        this.id = id;
    }
    validateUserId(userId) {
        if (!userId || typeof userId !== 'string') {
            throw new Error('User ID is required');
        }
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid user ID format');
        }
    }
    validateTokenHash(tokenHash) {
        if (!tokenHash || typeof tokenHash !== 'string') {
            throw new Error('Token hash is required');
        }
        if (tokenHash.length !== 60) {
            throw new Error('Invalid token hash format');
        }
    }
    validateExpiryDate(expiresAt) {
        if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
            throw new Error('Invalid expiry date');
        }
        if (expiresAt <= new Date()) {
            throw new Error('Token expiry date must be in the future');
        }
        const maxExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        if (expiresAt > maxExpiryDate) {
            throw new Error('Token expiry date cannot exceed 30 days');
        }
    }
    isExpired() {
        return this.expiresAt <= new Date();
    }
    isAboutToExpire() {
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return this.expiresAt.getTime() - new Date().getTime() <= twentyFourHours;
    }
    getRemainingTime() {
        return Math.max(0, this.expiresAt.getTime() - new Date().getTime());
    }
    static createWithExpiry(userId, tokenHash, daysToExpire = 7) {
        const expiresAt = new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000);
        return new RefreshTokenEntity(userId, tokenHash, expiresAt);
    }
}
exports.RefreshTokenEntity = RefreshTokenEntity;
//# sourceMappingURL=refresh-token.entity.js.map