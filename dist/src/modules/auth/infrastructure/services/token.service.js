"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const jwt_1 = require("../../../../config/jwt");
class TokenService {
    constructor() {
        this.accessTokenSecret = jwt_1.jwtConfig.accessSecret;
        this.refreshTokenSecret = jwt_1.jwtConfig.refreshSecret;
        this.accessTokenExpiry = jwt_1.jwtConfig.accessExpiry || '15m';
        this.refreshTokenExpiry = jwt_1.jwtConfig.refreshExpiry || '7d';
    }
    async generateTokens(userId, role, email) {
        try {
            const payload = {
                userId,
                email,
                role
            };
            const accessToken = jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
                expiresIn: this.accessTokenExpiry,
                issuer: 'learnmentor-auth',
                audience: 'learnmentor-app'
            });
            const refreshToken = jsonwebtoken_1.default.sign({
                userId,
                email,
                type: 'refresh'
            }, this.refreshTokenSecret, {
                expiresIn: this.refreshTokenExpiry,
                issuer: 'learnmentor-auth',
                audience: 'learnmentor-app'
            });
            return {
                accessToken,
                refreshToken
            };
        }
        catch (error) {
            throw new Error(`Token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.accessTokenSecret, {
                issuer: 'learnmentor-auth',
                audience: 'learnmentor-app'
            });
            return {
                userId: decoded.userId,
                role: decoded.role,
                email: decoded.email,
                iat: decoded.iat,
                exp: decoded.exp
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid access token');
            }
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Access token expired');
            }
            throw new Error(`Access token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.refreshTokenSecret, {
                issuer: 'learnmentor-auth',
                audience: 'learnmentor-app'
            });
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            return {
                userId: decoded.userId,
                email: decoded.email,
                iat: decoded.iat,
                exp: decoded.exp
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new Error('Refresh token expired');
            }
            throw new Error(`Refresh token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    extractTokenFromHeader(authHeader) {
        if (!authHeader || typeof authHeader !== 'string') {
            return null;
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }
        return parts[1];
    }
    isTokenExpired(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp) {
                return true;
            }
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        }
        catch (error) {
            return true;
        }
    }
    getTokenExpiryTime(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || !decoded.exp) {
                return null;
            }
            return new Date(decoded.exp * 1000);
        }
        catch (error) {
            return null;
        }
    }
    async validateTokenSignature(token, isRefreshToken = false) {
        try {
            const secret = isRefreshToken ? this.refreshTokenSecret : this.accessTokenSecret;
            jsonwebtoken_1.default.verify(token, secret, {
                issuer: 'learnmentor-auth',
                audience: 'learnmentor-app',
                ignoreExpiration: true
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.TokenService = TokenService;
class PasswordService {
    validatePasswordStrength(password) {
        const errors = [];
        let score = 0;
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        else if (password.length >= 8) {
            score += 2;
        }
        if (password.length > 12) {
            score += 1;
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        else {
            score += 2;
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        else {
            score += 2;
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        else {
            score += 2;
        }
        if (!/[@$!%*?&#]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        else {
            score += 3;
        }
        if (password.length > 16) {
            score += 2;
        }
        if (this.hasCommonPatterns(password)) {
            errors.push('Password contains common patterns and is not secure');
            score = Math.max(0, score - 3);
        }
        return {
            isValid: errors.length === 0,
            errors,
            score: Math.min(10, score)
        };
    }
    generateSecurePassword(length = 16) {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '@$!%*?&#';
        const allChars = uppercase + lowercase + numbers + symbols;
        let password = '';
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
    generateResetToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    async isPasswordRecentlyUsed(password, previousHashes) {
        return false;
    }
    hasCommonPatterns(password) {
        const commonPatterns = [
            /^password/i,
            /^123456/,
            /^qwerty/i,
            /^admin/i,
            /^letmein/i,
            /(.)\1{3,}/,
            /^(.)(.)\1\2/i,
            /012|123|234|345|456|567|678|789/,
            /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i
        ];
        return commonPatterns.some(pattern => pattern.test(password));
    }
}
exports.PasswordService = PasswordService;
//# sourceMappingURL=token.service.js.map