
import { Request, Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { Booking } from '../booking/booking.model';
import { Transaction } from '../transaction/transaction.model';
import { User } from '../auth/user.model';
import { TutorProfile } from '../tutor/tutor.model';
import mongoose from 'mongoose';

export class DashboardController {

    /**
     * Get Student Dashboard Stats
     * GET /api/dashboard/student
     */
    static async getStudentStats(req: AuthRequest, res: Response) {
        try {
            const studentId = req.user?.userId;
            if (!studentId) return res.status(401).json({ message: 'Unauthorized' });

            const objectId = new mongoose.Types.ObjectId(studentId);

            // Aggregation for Bookings Stats
            const stats = await Booking.aggregate([
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

            // Fetch recent bookings
            const recentBookings = await Booking.find({ student: studentId })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('tutor', 'fullName profileImage');

            // Fetch recent transactions
            const recentTransactions = await Transaction.find({ sender: studentId })
                .sort({ createdAt: -1 })
                .limit(10);

            res.json({
                success: true,
                stats: {
                    totalBookings: data.totalBookings,
                    upcomingBookings: await Booking.countDocuments({ student: studentId, status: { $in: ['PENDING', 'CONFIRMED', 'PAID'] } }),
                    completedBookings: data.completedBookings,
                    totalSpent: data.totalSpent,
                    totalTutorsWorkedWith: data.tutors.length,
                },
                recentBookings,
                recentTransactions
            });

        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get Tutor Dashboard Stats
     * GET /api/dashboard/tutor
     */
    static async getTutorStats(req: AuthRequest, res: Response) {
        try {
            const tutorId = req.user?.userId;
            if (!tutorId) return res.status(401).json({ message: 'Unauthorized' });

            const objectId = new mongoose.Types.ObjectId(tutorId);

            // Aggregation for Bookings Stats
            const stats = await Booking.aggregate([
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

            // Fetch Tutor Profile for rating
            const profile = await TutorProfile.findOne({ user: tutorId }).select('averageRating rating verificationStatus');

            // Fetch recent bookings
            const recentBookings = await Booking.find({ tutor: tutorId })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('student', 'fullName profileImage');

            // Fetch recent transactions (earnings)
            const recentTransactions = await Transaction.find({ receiver: tutorId, status: 'done' })
                .sort({ createdAt: -1 })
                .limit(10);

            // Calculate actual net earnings from transactions
            const earningStats = await Transaction.aggregate([
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
                    pendingBookings: await Booking.countDocuments({ tutor: tutorId, status: 'PENDING' }),
                    averageRating: profile?.averageRating || profile?.rating || 0,
                    verificationStatus: profile?.verificationStatus || 'PENDING',
                },
                recentBookings,
                recentTransactions
            });

        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get Admin Dashboard Stats
     * GET /api/dashboard/admin
     */
    static async getAdminStats(req: AuthRequest, res: Response) {
        try {
            // totalUsers, totalTutors, totalStudents
            const userStats = await User.aggregate([
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

            // totalBookings, totalCompletedSessions
            const bookingStats = await Booking.aggregate([
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

            // totalRevenue, totalCommission
            // Revenue = Total amount processed
            // Commission = Platform's share
            const financeStats = await Transaction.aggregate([
                { $match: { status: 'done' } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$amount' }, // Gross Flow
                        totalCommission: { $sum: '$commission' } // Platform Profit
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
                    pendingVerifications: await User.countDocuments({ role: 'TUTOR', verificationStatus: 'PENDING' })
                }
            });

        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
