"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = void 0;
const profile_service_1 = require("./profile.service");
const zod_1 = require("zod");
const handleValidationError = (error, res) => {
    if (error instanceof zod_1.z.ZodError) {
        const errors = error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
        }));
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }
    return false;
};
class ProfileController {
    static async getProfile(req, res) {
        try {
            if (!req.user || !req.user.sub) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const profile = await profile_service_1.ProfileService.getProfile(req.user.sub);
            res.status(200).json(profile);
        }
        catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
    static async updateProfile(req, res) {
        try {
            if (!req.user || !req.user.sub) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const file = req.file;
            const updatedProfile = await profile_service_1.ProfileService.updateProfile(req.user.sub, req.body, file);
            res.status(200).json({
                message: 'Profile updated successfully',
                profile: updatedProfile
            });
        }
        catch (error) {
            if (handleValidationError(error, res))
                return;
            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'Current password is incorrect') {
                return res.status(400).json({ error: error.message });
            }
            if (error.message.includes('Image upload failed')) {
                return res.status(500).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
    static async deleteProfileImage(req, res) {
        try {
            if (!req.user || !req.user.sub) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const updatedProfile = await profile_service_1.ProfileService.deleteProfileImage(req.user.sub);
            res.status(200).json({
                message: 'Profile image deleted successfully',
                profile: updatedProfile
            });
        }
        catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'No profile image to delete') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
}
exports.ProfileController = ProfileController;
//# sourceMappingURL=profile.controller.js.map