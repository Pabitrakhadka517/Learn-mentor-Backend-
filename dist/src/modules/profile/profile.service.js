"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const profile_repository_1 = require("./profile.repository");
const profile_dto_1 = require("./profile.dto");
const cloudinary_1 = __importDefault(require("../../config/cloudinary"));
const tutor_model_1 = require("../tutor/tutor.model");
class ProfileService {
    static async getProfile(userId) {
        const user = await profile_repository_1.ProfileRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        let profileData = this.formatProfileResponse(user);
        if (user.role === 'TUTOR') {
            const tutorProfile = await tutor_model_1.TutorProfile.findOne({ user: user._id });
            if (tutorProfile) {
                profileData = {
                    ...profileData,
                    bio: tutorProfile.bio,
                    hourlyRate: tutorProfile.hourlyRate,
                    experienceYears: tutorProfile.experienceYears,
                    subjects: tutorProfile.subjects,
                    languages: tutorProfile.languages,
                    verificationStatus: tutorProfile.verificationStatus
                };
            }
        }
        return profileData;
    }
    static async updateProfile(userId, dto, file) {
        try {
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
                updates.fullName = validated.name;
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
                    console.error('Cloudinary Error:', error);
                    throw new Error(`Image upload failed: ${error.message}`);
                }
            }
            const updatedUser = await profile_repository_1.ProfileRepository.updateProfile(userId, updates);
            if (!updatedUser) {
                throw new Error('Failed to update profile');
            }
            if (user.role === 'TUTOR') {
                const tutorUpdates = {};
                if (validated.bio !== undefined)
                    tutorUpdates.bio = validated.bio;
                if (validated.hourlyRate !== undefined)
                    tutorUpdates.hourlyRate = validated.hourlyRate;
                if (validated.experienceYears !== undefined)
                    tutorUpdates.experienceYears = validated.experienceYears;
                if (validated.subjects !== undefined)
                    tutorUpdates.subjects = validated.subjects;
                if (validated.languages !== undefined)
                    tutorUpdates.languages = validated.languages;
                if (Object.keys(tutorUpdates).length > 0) {
                    await tutor_model_1.TutorProfile.findOneAndUpdate({ user: userId }, { $set: tutorUpdates }, { upsert: true, new: true });
                }
            }
            return this.getProfile(userId);
        }
        catch (error) {
            console.error('ProfileUpdate Error:', error);
            throw error;
        }
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
        return this.getProfile(userId);
    }
    static async updateTheme(userId, theme) {
        const user = await profile_repository_1.ProfileRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        user.theme = theme;
        const updatedUser = await profile_repository_1.ProfileRepository.updateProfile(userId, { theme });
        if (!updatedUser) {
            throw new Error('Failed to update user theme');
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
            name: user.fullName,
            phone: user.phone,
            speciality: user.speciality,
            address: user.address,
            profileImage: user.profileImage,
            theme: user.theme,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
}
exports.ProfileService = ProfileService;
//# sourceMappingURL=profile.service.js.map