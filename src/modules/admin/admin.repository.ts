import { User, IUser } from "../auth/user.model";
import { Transaction } from "../transaction/transaction.model";

export class AdminRepository {
    /**
     * Get all users with pagination and filtering
     */
    static async getAllUsers(page: number = 1, limit: number = 10, role?: string, status?: string, verificationStatus?: string): Promise<{ users: any[], total: number }> {
        const skip = (page - 1) * limit;

        const matchStage: any = {};
        if (role) {
            matchStage.role = role;
        }

        if (status) {
            matchStage.isActive = status === 'Active';
        }

        const aggregation: any[] = [
            { $match: matchStage },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "tutorprofiles",
                    localField: "_id",
                    foreignField: "user",
                    as: "tutorProfile"
                }
            },
            {
                $unwind: {
                    path: "$tutorProfile",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: verificationStatus ? { "tutorProfile.verificationStatus": verificationStatus } : {}
            },
            {
                $project: {
                    passwordHash: 0,
                    __v: 0
                }
            },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [{ $skip: skip }, { $limit: limit }]
                }
            }
        ];

        const result = await User.aggregate(aggregation);
        const total = result[0].metadata[0]?.total || 0;
        const users = result[0].data;

        return { users, total };
    }

    /**
     * Get user statistics including earnings
     */
    static async getUserStats() {
        const total = await User.countDocuments();
        const tutors = await User.countDocuments({ role: "TUTOR" });
        const students = await User.countDocuments({ role: "STUDENT" });
        const admins = await User.countDocuments({ role: "ADMIN" });

        // Get earnings data from transactions
        const [earningsData] = await Transaction.aggregate([
            {
                $match: {
                    status: "done" // Only count completed transactions
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" },
                    totalCommission: { $sum: "$commission" },
                    totalTransactions: { $sum: 1 }
                }
            }
        ]);

        const earnings = earningsData || {
            totalRevenue: 0,
            totalCommission: 0,
            totalTransactions: 0
        };

        return { 
            total, 
            tutors, 
            students, 
            admins,
            earnings: {
                totalRevenue: earnings.totalRevenue,
                adminEarnings: earnings.totalCommission,
                totalTransactions: earnings.totalTransactions,
                averageCommission: earnings.totalTransactions > 0 
                    ? (earnings.totalCommission / earnings.totalTransactions).toFixed(2) 
                    : 0
            }
        };
    }

    /**
     * Update Tutor Verification Status
     */
    static async updateTutorVerificationStatus(tutorId: string, status: 'VERIFIED' | 'REJECTED' | 'PENDING') {
        const { TutorProfile } = require('../tutor/tutor.model');
        return await TutorProfile.findOneAndUpdate(
            { user: tutorId },
            { verificationStatus: status },
            { new: true }
        );
    }

    /**
     * Get single user details
     */
    static async getUserDetails(userId: string): Promise<any> {
        return await User.findById(userId)
            .populate({
                path: 'tutorProfile',
                model: 'TutorProfile'
            })
            .select('-passwordHash');
    }

    /**
     * Update user details
     */
    static async updateUser(userId: string, data: any) {
        return await User.findByIdAndUpdate(userId, data, { new: true });
    }

    /**
     * Delete user and related data
     */
    static async deleteUser(userId: string) {
        // In a real app, you might want to do a soft delete or cascading delete
        await User.findByIdAndDelete(userId);
        // Also delete tutor profile if exists
        const { TutorProfile } = require('../tutor/tutor.model');
        await TutorProfile.findOneAndDelete({ user: userId });
        return true;
    }
}
