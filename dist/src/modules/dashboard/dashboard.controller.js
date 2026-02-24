"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const booking_model_1 = require("../booking/booking.model");
const transaction_model_1 = require("../transaction/transaction.model");
const user_model_1 = require("../auth/user.model");
const tutor_model_1 = require("../tutor/tutor.model");
const mongoose_1 = __importDefault(require("mongoose"));
class DashboardController {
    static async getStudentStats(req, res) {
        try {
            const studentId = req.user?.userId;
            if (!studentId)
                return res.status(401).json({ message: 'Unauthorized' });
            const objectId = new mongoose_1.default.Types.ObjectId(studentId);
            const stats = await booking_model_1.Booking.aggregate([
                { $match: { student: objectId } },
                {
                    $group: {
                        _id: null,
                        totalBookings: { $sum: 1 },
                        completedBookings: {
                            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
                        },
                        totalSpent: {
                            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$price', 0] }
                        },
                        tutors: { $addToSet: '$tutor' }
                    }
                }
            ]);
            const data = stats[0] || { totalBookings: 0, completedBookings: 0, totalSpent: 0, tutors: [] };
            const recentBookings = await booking_model_1.Booking.find({ student: studentId })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('tutor', 'fullName profileImage');
            const recentTransactions = await transaction_model_1.Transaction.find({ sender: studentId })
                .sort({ createdAt: -1 })
                .limit(10);
            res.json({
                success: true,
                stats: {
                    totalBookings: data.totalBookings,
                    upcomingBookings: await booking_model_1.Booking.countDocuments({ student: studentId, status: { $in: ['PENDING', 'CONFIRMED', 'PAID'] } }),
                    completedBookings: data.completedBookings,
                    totalSpent: data.totalSpent,
                    totalTutorsWorkedWith: data.tutors.length,
                },
                recentBookings,
                recentTransactions
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async getTutorStats(req, res) {
        try {
            const tutorId = req.user?.userId;
            if (!tutorId)
                return res.status(401).json({ message: 'Unauthorized' });
            const objectId = new mongoose_1.default.Types.ObjectId(tutorId);
            const stats = await booking_model_1.Booking.aggregate([
                { $match: { tutor: objectId } },
                {
                    $group: {
                        _id: null,
                        totalBookings: { $sum: 1 },
                        completedBookings: {
                            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
                        },
                        students: { $addToSet: '$student' }
                    }
                }
            ]);
            const data = stats[0] || { totalBookings: 0, completedBookings: 0, students: [] };
            const profile = await tutor_model_1.TutorProfile.findOne({ user: tutorId }).select('averageRating rating verificationStatus');
            const recentBookings = await booking_model_1.Booking.find({ tutor: tutorId })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('student', 'fullName profileImage');
            const recentTransactions = await transaction_model_1.Transaction.find({ receiver: tutorId, status: 'done' })
                .sort({ createdAt: -1 })
                .limit(10);
            const earningStats = await transaction_model_1.Transaction.aggregate([
                { $match: { receiver: objectId, status: 'done' } },
                {
                    $group: {
                        _id: null,
                        totalNetEarned: { $sum: '$receiverAmount' }
                    }
                }
            ]);
            const netEarned = earningStats[0]?.totalNetEarned || 0;
            res.json({
                success: true,
                stats: {
                    totalEarnings: netEarned,
                    totalStudentsWorkedWith: data.students.length,
                    totalBookings: data.totalBookings,
                    completedBookings: data.completedBookings,
                    pendingBookings: await booking_model_1.Booking.countDocuments({ tutor: tutorId, status: 'PENDING' }),
                    averageRating: profile?.averageRating || profile?.rating || 0,
                    verificationStatus: profile?.verificationStatus || 'PENDING',
                },
                recentBookings,
                recentTransactions
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async getAdminStats(req, res) {
        try {
            const userStats = await user_model_1.User.aggregate([
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 }
                    }
                }
            ]);
            const studentCount = userStats.find(s => s._id === 'STUDENT')?.count || 0;
            const tutorCount = userStats.find(s => s._id === 'TUTOR')?.count || 0;
            const adminCount = userStats.find(s => s._id === 'ADMIN')?.count || 0;
            const totalUsers = studentCount + tutorCount + adminCount;
            const bookingStats = await booking_model_1.Booking.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        completed: {
                            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
                        }
                    }
                }
            ]);
            const totalBookings = bookingStats[0]?.total || 0;
            const totalCompletedSessions = bookingStats[0]?.completed || 0;
            const financeStats = await transaction_model_1.Transaction.aggregate([
                { $match: { status: 'done' } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$amount' },
                        totalCommission: { $sum: '$commission' }
                    }
                }
            ]);
            res.json({
                success: true,
                stats: {
                    totalUsers,
                    totalStudents: studentCount,
                    totalTutors: tutorCount,
                    totalBookings,
                    totalCompletedSessions,
                    totalRevenue: financeStats[0]?.totalRevenue || 0,
                    totalCommission: financeStats[0]?.totalCommission || 0,
                    pendingVerifications: await user_model_1.User.countDocuments({ role: 'TUTOR', verificationStatus: 'PENDING' })
                }
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=dashboard.controller.js.map