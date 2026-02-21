import { Router } from "express";
import { AdminController } from "./admin.controller";
import { AnnouncementController } from "./announcement.controller";
import { authenticate, authorizeRoles } from "../auth/auth.middleware";

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative management endpoints
 */
const router = Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all registered users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [STUDENT, TUTOR, ADMIN]
 *         description: Filter by user role
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       name:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 */
router.get("/users", authenticate, authorizeRoles('ADMIN'), AdminController.getAllUsers);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     totalBookings:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                     activeTutors:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admins only
 */
router.get("/stats", authenticate, authorizeRoles('ADMIN'), AdminController.getPlatformStats);

/**
 * @swagger
 * /api/admin/seed/tutors:
 *   post:
 *     summary: Seed random tutors
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Tutors seeded successfully
 *       403:
 *         description: Forbidden
 */
router.post("/seed/tutors", authenticate, authorizeRoles('ADMIN'), AdminController.seedTutors);

/**
 * @swagger
 * /api/admin/tutors/{tutorId}/verify:
 *   patch:
 *     summary: Verify or Reject a tutor
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tutorId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [VERIFIED, REJECTED, PENDING]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       403:
 *         description: Forbidden
 */
router.patch("/tutors/:tutorId/verify", authenticate, authorizeRoles('ADMIN'), AdminController.verifyTutor);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 */
router.get("/users/:id", authenticate, authorizeRoles('ADMIN'), AdminController.getUserById);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put("/users/:id", authenticate, authorizeRoles('ADMIN'), AdminController.updateUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 */
router.delete("/users/:id", authenticate, authorizeRoles('ADMIN'), AdminController.deleteUser);

/**
 * Announcements
 */
router.post("/announcements", authenticate, authorizeRoles('ADMIN'), AnnouncementController.create);
router.get("/announcements", authenticate, AnnouncementController.getAll);
router.delete("/announcements/:id", authenticate, authorizeRoles('ADMIN'), AnnouncementController.delete);

export default router;
