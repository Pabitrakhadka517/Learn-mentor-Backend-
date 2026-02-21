import { AdminRepository } from "./admin.repository";

export class AdminService {
    /**
     * Get users for admin with pagination
     */
    static async getUsers(page: number = 1, limit: number = 10, role?: string) {
        const { users, total } = await AdminRepository.getAllUsers(page, limit, role);

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

    /**
     * Get admin dashboard stats
     */
    static async getStats() {
        return await AdminRepository.getUserStats();
    }

    /**
     * Verify or Reject a Tutor
     */
    static async verifyTutor(tutorId: string, status: 'VERIFIED' | 'REJECTED' | 'PENDING') {
        return await AdminRepository.updateTutorVerificationStatus(tutorId, status);
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string) {
        const user = await AdminRepository.getUserDetails(userId);
        if (!user) return null;

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

    /**
     * Update user
     */
    static async updateUser(userId: string, data: any) {
        return await AdminRepository.updateUser(userId, data);
    }

    /**
     * Delete user
     */
    static async deleteUser(userId: string) {
        return await AdminRepository.deleteUser(userId);
    }
}
