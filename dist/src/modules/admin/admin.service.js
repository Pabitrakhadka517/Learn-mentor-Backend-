"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const admin_repository_1 = require("./admin.repository");
class AdminService {
    static async getUsers(page = 1, limit = 10, role) {
        const { users, total } = await admin_repository_1.AdminRepository.getAllUsers(page, limit, role);
        const mappedUsers = users.map(user => ({
            id: user._id.toString(),
            name: user.fullName || "N/A",
            email: user.email,
            phone: user.phone || "N/A",
            role: user.role,
            status: user.isActive ? "Active" : "Inactive",
            joined: user.createdAt,
            profileImage: user.profileImage,
            speciality: user.speciality || (user.tutorProfile?.subjects ? user.tutorProfile.subjects.join(', ') : "N/A"),
            hourlyRate: user.tutorProfile?.hourlyRate,
            verificationStatus: user.tutorProfile?.verificationStatus
        }));
        return {
            users: mappedUsers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    static async getStats() {
        return await admin_repository_1.AdminRepository.getUserStats();
    }
    static async verifyTutor(tutorId, status) {
        return await admin_repository_1.AdminRepository.updateTutorVerificationStatus(tutorId, status);
    }
    static async getUserById(userId) {
        const user = await admin_repository_1.AdminRepository.getUserDetails(userId);
        if (!user)
            return null;
        return {
            id: user._id.toString(),
            name: user.fullName || "N/A",
            email: user.email,
            role: user.role,
            phone: user.phone || "N/A",
            speciality: user.speciality || "N/A",
            address: user.address || "N/A",
            profileImage: user.profileImage,
            status: user.isActive ? "Active" : "Inactive",
            joined: user.createdAt,
            tutorProfile: user.tutorProfile
        };
    }
    static async updateUser(userId, data) {
        return await admin_repository_1.AdminRepository.updateUser(userId, data);
    }
    static async deleteUser(userId) {
        return await admin_repository_1.AdminRepository.deleteUser(userId);
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map