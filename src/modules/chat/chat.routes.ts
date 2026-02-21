import { Router } from 'express';
import { ChatController } from './chat.controller';
import { authenticate } from '../auth/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Real-time messaging endpoints (Socket.io for live messages)
 */
const router = Router();

// Protect all chat routes
router.use(authenticate);

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Get user's active chat conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 chats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       participants:
 *                         type: array
 *                         items:
 *                           type: object
 *                       lastMessage:
 *                         type: object
 *                       unreadCount:
 *                         type: integer
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/', ChatController.getChats);

/**
 * @swagger
 * /api/chats:
 *   post:
 *     summary: Create a new chat conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participantId:
 *                 type: string
 *                 description: ID of the user to start a chat with
 *             example:
 *               participantId: "60c72b2f9b1e8c001c8e4a1b"
 *     responses:
 *       201:
 *         description: Chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 chat:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     participants:
 *                       type: array
 *                       items:
 *                         type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request (e.g., participantId missing or invalid)
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Chat with this participant already exists
 */
router.post('/', ChatController.createChat);

/**
 * @swagger
 * /api/chats/{id}/messages:
 *   get:
 *     summary: Get messages for a specific chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
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
 *           default: 50
 *         description: Messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       sender:
 *                         type: object
 *                       content:
 *                         type: string
 *                       isRead:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 */
router.post('/:id/messages', ChatController.sendMessage);
router.get('/:id/messages', ChatController.getMessages);

/**
 * @swagger
 * /api/chats/{id}/read:
 *   post:
 *     summary: Mark all messages in a chat as read
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Messages marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat not found
 */
router.post('/:id/read', ChatController.markRead);

export default router;
