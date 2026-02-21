
import { Router } from 'express';
import { authenticate, authorizeRoles } from '../auth/auth.middleware';
import { BookingController } from './booking.controller';

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Session booking and management endpoints
 */
const router = Router();

/**
 * @swagger
 * /api/bookings/book:
 *   post:
 *     summary: Create a new booking (Students only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tutorId
 *               - startTime
 *               - endTime
 *             properties:
 *               tutorId:
 *                 type: string
 *                 description: ID of the tutor to book
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Session start time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: Session end time
 *               notes:
 *                 type: string
 *                 description: Optional notes for the tutor
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Validation error or time slot conflict
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Students only
 *       404:
 *         description: Tutor not found
 */
router.post('/book', authenticate, authorizeRoles('STUDENT'), BookingController.createBooking);

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get my bookings (Student or Tutor)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, COMPLETED, CANCELLED, REJECTED]
 *         description: Filter by booking status
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 bookings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       student:
 *                         type: object
 *                       tutor:
 *                         type: object
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                       notes:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, BookingController.getBookings);

/**
 * @swagger
 * /api/bookings/{bookingId}/status:
 *   patch:
 *     summary: Update booking status (Tutor or Admin)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMED, REJECTED]
 *                 description: New booking status
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       400:
 *         description: Invalid status or booking state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Tutors and Admins only
 *       404:
 *         description: Booking not found
 */
router.patch('/:bookingId/status', authenticate, authorizeRoles('TUTOR', 'ADMIN'), BookingController.updateBookingStatus);

/**
 * @swagger
 * /api/bookings/{id}/complete:
 *   patch:
 *     summary: Mark booking as completed (Tutors only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking marked as completed
 *       400:
 *         description: Booking cannot be completed (wrong status)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Tutors only
 *       404:
 *         description: Booking not found
 */
router.patch('/:id/complete', authenticate, authorizeRoles('TUTOR', 'STUDENT'), BookingController.completeBooking);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking (Student or Tutor)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional cancellation reason
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Booking cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to cancel this booking
 *       404:
 *         description: Booking not found
 */
router.patch('/:id/cancel', authenticate, BookingController.cancelBooking);
router.put('/:id', authenticate, authorizeRoles('STUDENT'), BookingController.updateBooking);

export default router;
