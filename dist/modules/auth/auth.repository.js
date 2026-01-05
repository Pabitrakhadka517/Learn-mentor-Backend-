"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const user_model_1 = require("./user.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
class AuthRepository {
    static async findByEmail(email) {
        return await user_model_1.User.findOne({ email: email.toLowerCase() });
    }
    static async findById(userId) {
        return await user_model_1.User.findById(userId);
    }
    static async createUser(email, passwordHash, role = 'user') {
        const user = await user_model_1.User.create({
            email: email.toLowerCase(),
            passwordHash,
            role,
        });
        return user;
    }
    static async updateRefreshTokenHash(userId, tokenHash) {
        return await user_model_1.User.findByIdAndUpdate(userId, { refreshTokenHash: tokenHash }, { new: true });
    }
    static async emailExists(email) {
        const user = await user_model_1.User.findOne({ email: email.toLowerCase() });
        return !!user;
    }
    static async getUserForLogin(email) {
        return await user_model_1.User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    }
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt_1.default.compare(plainPassword, hashedPassword);
    }
    static async hashPassword(password) {
        return await bcrypt_1.default.hash(password, 10);
    }
    static async clearRefreshToken(userId) {
        return await user_model_1.User.findByIdAndUpdate(userId, { refreshTokenHash: null }, { new: true });
    }
}
exports.AuthRepository = AuthRepository;
//# sourceMappingURL=auth.repository.js.map