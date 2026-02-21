import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import {
    initTransaction,
    initBookingTransaction,
    payTransaction,
    getSenderTransactions,
    getReceiverTransactions
} from './transaction.controller';

const router = Router();

/**
 * @swagger
 * /api/transactions/bookings/transaction/{bookingId}:
 *   get:
 *     summary: Initialize a transaction for a booking
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction initialized successfully
 */
router.get('/bookings/transaction/:bookingId', authenticate, initBookingTransaction);

/**
 * @swagger
 * /api/transactions/bookings/transaction/{tId}/pay:
 *   post:
 *     summary: Process payment for a booking transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 */
router.post('/bookings/transaction/:tId/pay', authenticate, payTransaction);

/**
 * @swagger
 * /api/transactions/jobs/transaction/{jobId}:
 *   get:
 *     summary: Initialize a transaction for a booking
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the booking/job to pay for
 *     responses:
 *       200:
 *         description: Transaction initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     status:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.get('/jobs/transaction/:jobId', authenticate, initTransaction);

/**
 * @swagger
 * /api/transactions/jobs/transaction/{tId}/pay:
 *   post:
 *     summary: Process payment for a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method details
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Payment failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaction not found
 */
router.post('/jobs/transaction/:tId/pay', authenticate, payTransaction);

/**
 * @swagger
 * /api/transactions/transactions/sent:
 *   get:
 *     summary: Get history of sent payments (Student)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sent transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions/sent', authenticate, getSenderTransactions);

/**
 * @swagger
 * /api/transactions/transactions/received:
 *   get:
 *     summary: Get history of received payments (Tutor)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Received transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions/received', authenticate, getReceiverTransactions);

export default router;
