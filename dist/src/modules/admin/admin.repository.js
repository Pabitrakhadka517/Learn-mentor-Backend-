"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRepository = void 0;
const user_model_1 = require("../auth/user.model");
const transaction_model_1 = require("../transaction/transaction.model");
class AdminRepository {
    static async getAllUsers(page = 1, limit = 10, role, status, verificationStatus) {
        const skip = (page - 1) * limit;
        const matchStage = {};
        if (role) {
            matchStage.role = role;
        }
        if (status) {
            matchStage.isActive = status === 'Active';
        }
        const aggregation = [
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
        const result = await user_model_1.User.aggregate(aggregation);
        const total = result[0].metadata[0]?.total || 0;
        const users = result[0].data;
        return { users, total };
    }
    static async getUserStats() {
        const total = await user_model_1.User.countDocuments();
        const tutors = await user_model_1.User.countDocuments({ role: "TUTOR" });
        const students = await user_model_1.User.countDocuments({ role: "STUDENT" });
        const admins = await user_model_1.User.countDocuments({ role: "ADMIN" });
        const [earningsData] = await transaction_model_1.Transaction.aggregate([
            {
                $match: {
                    status: "done"
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
    static async updateTutorVerificationStatus(tutorId, status) {
        const { TutorProfile } = require('../tutor/tutor.model');
        return await TutorProfile.findOneAndUpdate({ user: tutorId }, { verificationStatus: status }, { new: true });
    }
    static async getUserDetails(userId) {
        return await user_model_1.User.findById(userId)
            .populate({
            path: 'tutorProfile',
            model: 'TutorProfile'
        })
            .select('-passwordHash');
    }
    static async updateUser(userId, data) {
        return await user_model_1.User.findByIdAndUpdate(userId, data, { new: true });
    }
    static async deleteUser(userId) {
        await user_model_1.User.findByIdAndDelete(userId);
        const { TutorProfile } = require('../tutor/tutor.model');
        await TutorProfile.findOneAndDelete({ user: userId });
        return true;
    }
}
exports.AdminRepository = AdminRepository;
//# sourceMappingURL=admin.repository.js.map