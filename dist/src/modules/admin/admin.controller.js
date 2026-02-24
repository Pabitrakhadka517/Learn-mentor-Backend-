"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
const tutor_seeding_1 = require("../tutor/tutor.seeding");
class AdminController {
    static async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const role = req.query.role;
            const result = await admin_service_1.AdminService.getUsers(page, limit, role);
            res.status(200).json({
                success: true,
                ...result
            });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message || "Internal server error" });
        }
    }
    static async getPlatformStats(req, res) {
        try {
            const stats = await admin_service_1.AdminService.getStats();
            res.status(200).json(stats);
        }
        catch (error) {
            res.status(500).json({ error: error.message || "Internal server error" });
        }
    }
    static async seedTutors(req, res) {
        try {
            const count = parseInt(req.query.count) || 5;
            await (0, tutor_seeding_1.seedTutors)(count);
            res.status(200).json({ success: true, message: `Successfully seeded ${count} tutors` });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async verifyTutor(req, res) {
        try {
            const { tutorId } = req.params;
            const { status } = req.body;
            if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
                return res.status(400).json({ success: false, message: "Invalid status" });
            }
            const profile = await admin_service_1.AdminService.verifyTutor(tutorId, status);
            if (!profile) {
                return res.status(404).json({ success: false, message: "Tutor profile not found" });
            }
            res.status(200).json({
                success: true,
                message: `Tutor status updated to ${status}`,
                profile
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await admin_service_1.AdminService.getUserById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            res.status(200).json({ success: true, user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const user = await admin_service_1.AdminService.updateUser(id, req.body);
            res.status(200).json({ success: true, message: "User updated successfully", user });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            await admin_service_1.AdminService.deleteUser(id);
            res.status(200).json({ success: true, message: "User deleted successfully" });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map