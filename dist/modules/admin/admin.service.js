"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const admin_repository_1 = require("./admin.repository");
class AdminService {
    static async getUsers() {
        const users = await admin_repository_1.AdminRepository.getAllUsers();
        return users.map(user => ({
            id: user._id.toString(),
            name: user.fullName || "N/A",
            email: user.email,
            phone: user.phone || "N/A",
            role: user.role,
            status: user.isActive ? "Active" : "Inactive",
            joined: user.createdAt,
            profileImage: user.profileImage,
            speciality: user.speciality
        }));
    }
    static async getStats() {
        return await admin_repository_1.AdminRepository.getUserStats();
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map