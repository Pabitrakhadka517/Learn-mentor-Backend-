
import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { createReview, getTutorReviews } from './review.controller';

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Tutor review and rating endpoints
 */
const router = Router();

/**
 * @swagger
 * /api/reviews/{bookingId}:
 *   post:
 *     summary: Create a review for a completed booking
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the completed booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *               comment:
 *                 type: string
 *                 description: Optional review comment
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid booking or already reviewed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.post('/:bookingId', authenticate, createReview);

/**
 * @swagger
 * /api/reviews/tutor/{tutorId}:
 *   get:
 *     summary: Get all reviews for a specific tutor (Public)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: tutorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tutor user ID
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
 *         description: Reviews per page
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       student:
 *                         type: object
 *                       rating:
 *                         type: integer
 *                       comment:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 averageRating:
 *                   type: number
 *                 totalReviews:
 *                   type: integer
 *       404:
 *         description: Tutor not found
 */
router.get('/tutor/:tutorId', getTutorReviews);

export default router;
