import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { authMiddleware } from '../auth/auth.middleware';
import { uploadProfileImage } from './profile.middleware';

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management endpoints
 */
const router = Router();

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 name:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 speciality:
 *                   type: string
 *                 address:
 *                   type: string
 *                 profileImage:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/', authMiddleware, ProfileController.getProfile);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 minLength: 2
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *                 description: Phone number (10-15 digits)
 *                 pattern: '^[0-9]{10,15}$'
 *               speciality:
 *                 type: string
 *                 description: User's speciality or expertise
 *                 minLength: 2
 *                 maxLength: 200
 *               address:
 *                 type: string
 *                 description: User's address
 *                 minLength: 5
 *                 maxLength: 500
 *               oldPassword:
 *                 type: string
 *                 description: Current password (required if changing password)
 *                 minLength: 6
 *               newPassword:
 *                 type: string
 *                 description: New password
 *                 minLength: 6
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (max 5MB, images only)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 profile:
 *                   type: object
 *       400:
 *         description: Validation error or incorrect password
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/', authMiddleware, uploadProfileImage, ProfileController.updateProfile);

/**
 * @swagger
 * /api/profile/image:
 *   delete:
 *     summary: Delete profile image
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile image deleted successfully
 *       400:
 *         description: No profile image to delete
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete('/image', authMiddleware, ProfileController.deleteProfileImage);

export default router;
