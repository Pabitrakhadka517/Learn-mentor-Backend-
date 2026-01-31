"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const profile_repository_1 = require("./profile.repository");
const profile_dto_1 = require("./profile.dto");
const cloudinary_1 = __importDefault(require("../../config/cloudinary"));
class ProfileService {
    static async getProfile(userId) {
        const user = await profile_repository_1.ProfileRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return this.formatProfileResponse(user);
    }
    static async updateProfile(userId, dto, file) {
        const validated = profile_dto_1.UpdateProfileDTOSchema.parse(dto);
        const user = await profile_repository_1.ProfileRepository.findByIdWithPassword(userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (validated.newPassword && validated.oldPassword) {
            const isPasswordValid = await profile_repository_1.ProfileRepository.verifyPassword(validated.oldPassword, user.passwordHash);
            if (!isPasswordValid) {
                throw new Error('Current password is incorrect');
            }
            const newPasswordHash = await profile_repository_1.ProfileRepository.hashPassword(validated.newPassword);
            await profile_repository_1.ProfileRepository.updatePassword(userId, newPasswordHash);
        }
        const updates = {};
        if (validated.name !== undefined)
            updates.name = validated.name;
        if (validated.phone !== undefined)
            updates.phone = validated.phone;
        if (validated.speciality !== undefined)
            updates.speciality = validated.speciality;
        if (validated.address !== undefined)
            updates.address = validated.address;
        if (file) {
            try {
                if (user.profileImage) {
                    const publicId = this.extractPublicId(user.profileImage);
                    if (publicId) {
                        await cloudinary_1.default.uploader.destroy(publicId);
                    }
                }
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary_1.default.uploader.upload_stream({
                        folder: 'learnmentor/profiles',
                        transformation: [
                            { width: 500, height: 500, crop: 'fill' },
                            { quality: 'auto' }
                        ]
                    }, (error, result) => {
                        if (error)
                            reject(error);
                        else
                            resolve(result);
                    });
                    uploadStream.end(file.buffer);
                });
                updates.profileImage = result.secure_url;
            }
            catch (error) {
                throw new Error(`Image upload failed: ${error.message}`);
            }
        }
        const updatedUser = await profile_repository_1.ProfileRepository.updateProfile(userId, updates);
        if (!updatedUser) {
            throw new Error('Failed to update profile');
        }
        return this.formatProfileResponse(updatedUser);
    }
    static async deleteProfileImage(userId) {
        const user = await profile_repository_1.ProfileRepository.findByIdWithPassword(userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (!user.profileImage) {
            throw new Error('No profile image to delete');
        }
        try {
            const publicId = this.extractPublicId(user.profileImage);
            if (publicId) {
                await cloudinary_1.default.uploader.destroy(publicId);
            }
        }
        catch (error) {
            console.error('Failed to delete image from Cloudinary:', error);
        }
        const updatedUser = await profile_repository_1.ProfileRepository.deleteProfileImage(userId);
        if (!updatedUser) {
            throw new Error('Failed to delete profile image');
        }
        return this.formatProfileResponse(updatedUser);
    }
    static extractPublicId(url) {
        try {
            const matches = url.match(/\/learnmentor\/profiles\/([^/.]+)/);
            return matches ? `learnmentor/profiles/${matches[1]}` : null;
        }
        catch {
            return null;
        }
    }
    static formatProfileResponse(user) {
        return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            phone: user.phone,
            speciality: user.speciality,
            address: user.address,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
}
exports.ProfileService = ProfileService;
//# sourceMappingURL=profile.service.js.map