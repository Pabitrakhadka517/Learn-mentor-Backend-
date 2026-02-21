"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
class AdminController {
    static async getAllUsers(req, res) {
        try {
            const users = await admin_service_1.AdminService.getUsers();
            res.status(200).json(users);
        }
        catch (error) {
            res.status(500).json({ error: error.message || "Internal server error" });
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
}
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map