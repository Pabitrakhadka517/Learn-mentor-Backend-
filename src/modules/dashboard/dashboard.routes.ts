
import { Router } from 'express';
import { authenticate, authorizeRole, authorizeRoles } from '../auth/auth.middleware';
import { DashboardController } from './dashboard.controller';

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Role-specific dashboard statistics
 */
const router = Router();

/**
 * @swagger
 * /api/dashboard/student:
 *   get:
 *     summary: Get student dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalBookings:
 *                       type: integer
 *                     upcomingBookings:
 *                       type: integer
 *                     completedBookings:
 *                       type: integer
 *                     totalSpent:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Students only
 */
router.get('/student', authenticate, authorizeRole('STUDENT'), DashboardController.getStudentStats);

/**
 * @swagger
 * /api/dashboard/tutor:
 *   get:
 *     summary: Get tutor dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tutor statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalBookings:
 *                       type: integer
 *                     pendingBookings:
 *                       type: integer
 *                     completedBookings:
 *                       type: integer
 *                     totalEarnings:
 *                       type: number
 *                     averageRating:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Tutors only
 */
router.get('/tutor', authenticate, authorizeRole('TUTOR'), DashboardController.getTutorStats);

/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                     totalStudents:
 *                       type: integer
 *                     totalTutors:
 *                       type: integer
 *                     totalBookings:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                     pendingVerifications:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 */
router.get('/admin', authenticate, authorizeRole('ADMIN'), DashboardController.getAdminStats);

export default router;
