import { Request, Response } from 'express';
import { TutorService } from './tutor.service';
import { TutorQuerySchema } from './tutor.dto';
import { ZodError } from 'zod';

export class TutorController {
    /**
     * Get filtering, searching, and sorting options for tutors
     * GET /api/tutors
     */
    static async getTutors(req: Request, res: Response) {
        try {
            // Validate query parameters
            const query = TutorQuerySchema.parse(req.query);

            const result = await TutorService.getTutors(query);

            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid query parameters',
                    errors: error.errors
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch tutors'
            });
        }
    }

    /**
     * Get tutor details by ID
     * GET /api/tutors/:id
     */
    static async getTutorById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const tutor = await TutorService.getTutorById(id);

            res.status(200).json({
                success: true,
                tutor
            });
        } catch (error: any) {
            if (error.message === 'Tutor not found' || error.message === 'Tutor is not verified') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch tutor details'
            });
        }
    }

    /**
     * Get authenticated tutor's availability
     * GET /api/tutors/my/availability
     */
    static async getMyAvailability(req: any, res: Response) {
        try {
            const tutorId = req.user.userId;
            const { startDate, endDate } = req.query;

            const slots = await TutorService.getAvailabilitySlots(
                tutorId,
                startDate ? new Date(startDate as string) : undefined,
                endDate ? new Date(endDate as string) : undefined
            );

            res.status(200).json({
                success: true,
                slots
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch availability'
            });
        }
    }

    /**
     * Set authenticated tutor's availability
     * POST /api/tutors/my/availability
     */
    static async setMyAvailability(req: any, res: Response) {
        try {
            const tutorId = req.user.userId;
            const { slots } = req.body;

            if (!Array.isArray(slots)) {
                return res.status(400).json({
                    success: false,
                    message: 'Slots must be an array'
                });
            }

            await TutorService.setAvailabilitySlots(tutorId, slots);

            res.status(200).json({
                success: true,
                message: 'Availability updated successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update availability'
            });
        }
    }

    /**
     * Submit profile for verification
     * POST /api/tutors/my/verify/submit
     */
    static async submitVerification(req: any, res: Response) {
        try {
            const tutorId = req.user.userId;
            await TutorService.submitVerification(tutorId);

            res.status(200).json({
                success: true,
                message: 'Profile submitted for verification successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to submit verification'
            });
        }
    }
}
