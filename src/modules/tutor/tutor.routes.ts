import { Router } from 'express';
import { TutorController } from './tutor.controller';
import { authenticate, authorizeRoles } from '../auth/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Tutors
 *   description: Tutor discovery and profile endpoints
 */
const router = Router();

/**
 * @swagger
 * /api/tutors:
 *   get:
 *     summary: Get list of verified tutors (Students only)
 *     tags: [Tutors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of tutors per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by tutor name or speciality
 *       - in: query
 *         name: speciality
 *         schema:
 *           type: string
 *         description: Filter by speciality
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, rating, createdAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of tutors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 tutors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       speciality:
 *                         type: string
 *                       profileImage:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       reviewCount:
 *                         type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Students only
 */
router.get('/', authenticate, authorizeRoles('STUDENT', 'ADMIN', 'TUTOR'), TutorController.getTutors);



/**
 * @swagger
 * /api/tutors/my/availability:
 *   get:
 *     summary: Get authenticated tutor's availability (Tutors only)
 *     tags: [Tutors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Availability slots retrieved successfully
 */
router.get('/my/availability', authenticate, authorizeRoles('TUTOR'), TutorController.getMyAvailability);

/**
 * @swagger
 * /api/tutors/my/availability:
 *   post:
 *     summary: Set authenticated tutor's availability (Tutors only)
 *     tags: [Tutors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       200:
 *         description: Availability updated successfully
 */
router.post('/my/availability', authenticate, authorizeRoles('TUTOR'), TutorController.setMyAvailability);

/**
 * @swagger
 * /api/tutors/my/verify/submit:
 *   post:
 *     summary: Submit tutor profile for verification
 *     tags: [Tutors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile submitted for verification
 */
router.post('/my/verify/submit', authenticate, authorizeRoles('TUTOR'), TutorController.submitVerification);

/**
 * @swagger
 * /api/tutors/{id}/availability:
 *   get:
 *     summary: Get tutor's public availability slots
 *     tags: [Tutors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tutor profile ID or User ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Tutor availability retrieved successfully
 *       404:
 *         description: Tutor not found
 */
router.get('/:id/availability', authenticate, authorizeRoles('STUDENT', 'ADMIN', 'TUTOR'), TutorController.getTutorAvailability);

/**
 * @swagger
 * /api/tutors/{id}:
 *   get:
 *     summary: Get detailed tutor profile by ID
 *     tags: [Tutors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tutor profile ID or User ID
 *     responses:
 *       200:
 *         description: Tutor profile retrieved successfully
 *       404:
 *         description: Tutor not found
 */
router.get('/:id', authenticate, authorizeRoles('STUDENT', 'ADMIN', 'TUTOR'), TutorController.getTutorById);

export default router;
