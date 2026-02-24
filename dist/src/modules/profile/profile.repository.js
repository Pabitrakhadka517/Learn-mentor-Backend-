"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileRepository = void 0;
const user_model_1 = require("../auth/user.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
class ProfileRepository {
    static async findById(userId) {
        return await user_model_1.User.findById(userId).select('-passwordHash -refreshTokenHash');
    }
    static async findByIdWithPassword(userId) {
        return await user_model_1.User.findById(userId);
    }
    static async updateProfile(userId, updates) {
        return await user_model_1.User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true }).select('-passwordHash -refreshTokenHash');
    }
    static async updatePassword(userId, newPasswordHash) {
        await user_model_1.User.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });
    }
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt_1.default.compare(plainPassword, hashedPassword);
    }
    static async hashPassword(password) {
        return await bcrypt_1.default.hash(password, 10);
    }
    static async deleteProfileImage(userId) {
        return await user_model_1.User.findByIdAndUpdate(userId, { $unset: { profileImage: 1 } }, { new: true }).select('-passwordHash -refreshTokenHash');
    }
}
exports.ProfileRepository = ProfileRepository;
//# sourceMappingURL=profile.repository.js.map