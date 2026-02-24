"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementController = void 0;
const announcement_model_1 = require("./announcement.model");
class AnnouncementController {
    static async create(req, res) {
        try {
            const { title, content, targetRole, type, expiresAt } = req.body;
            const announcement = await announcement_model_1.Announcement.create({
                title,
                content,
                targetRole,
                type,
                expiresAt,
                createdBy: req.user.userId
            });
            res.status(201).json({ success: true, announcement });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getAll(req, res) {
        try {
            const { role } = req.user;
            const filter = { isActive: true };
            if (role !== 'ADMIN') {
                filter.targetRole = { $in: ['ALL', role] };
            }
            const announcements = await announcement_model_1.Announcement.find(filter).sort({ createdAt: -1 });
            res.status(200).json({ success: true, announcements });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async delete(req, res) {
        try {
            await announcement_model_1.Announcement.findByIdAndDelete(req.params.id);
            res.status(200).json({ success: true, message: "Announcement deleted" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AnnouncementController = AnnouncementController;
//# sourceMappingURL=announcement.controller.js.map