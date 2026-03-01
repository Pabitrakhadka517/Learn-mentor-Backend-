"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorController = void 0;
const tutor_service_1 = require("./tutor.service");
const tutor_dto_1 = require("./tutor.dto");
const zod_1 = require("zod");
const socket_1 = require("../../socket");
class TutorController {
    static async getTutors(req, res) {
        try {
            const query = tutor_dto_1.TutorQuerySchema.parse(req.query);
            const result = await tutor_service_1.TutorService.getTutors(query);
            res.status(200).json({
                success: true,
                ...result
            });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
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
    static async getTutorById(req, res) {
        try {
            const { id } = req.params;
            const tutor = await tutor_service_1.TutorService.getTutorById(id);
            res.status(200).json({
                success: true,
                tutor
            });
        }
        catch (error) {
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
    static async getTutorAvailability(req, res) {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const slots = await tutor_service_1.TutorService.getPublicAvailabilitySlots(id, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.status(200).json({
                success: true,
                slots
            });
        }
        catch (error) {
            if (error.message === 'Tutor not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch tutor availability'
            });
        }
    }
    static async getMyAvailability(req, res) {
        try {
            const tutorId = req.user.userId;
            const { startDate, endDate } = req.query;
            const slots = await tutor_service_1.TutorService.getAvailabilitySlots(tutorId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.status(200).json({
                success: true,
                slots
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch availability'
            });
        }
    }
    static async setMyAvailability(req, res) {
        try {
            const tutorId = req.user.userId;
            const { slots } = req.body;
            if (!Array.isArray(slots)) {
                return res.status(400).json({
                    success: false,
                    message: 'Slots must be an array'
                });
            }
            await tutor_service_1.TutorService.setAvailabilitySlots(tutorId, slots);
            if (socket_1.io) {
                socket_1.io.to(`availability:${tutorId}`).emit('availability_updated', {
                    tutorId,
                    updatedAt: new Date().toISOString()
                });
            }
            res.status(200).json({
                success: true,
                message: 'Availability updated successfully'
            });
        }
        catch (error) {
            const validationMessages = new Set([
                'Invalid slot date/time format',
                'Each slot must have endTime after startTime',
                'Availability slots cannot overlap'
            ]);
            if (validationMessages.has(error.message)) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update availability'
            });
        }
    }
    static async submitVerification(req, res) {
        try {
            const tutorId = req.user.userId;
            await tutor_service_1.TutorService.submitVerification(tutorId);
            res.status(200).json({
                success: true,
                message: 'Profile submitted for verification successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to submit verification'
            });
        }
    }
}
exports.TutorController = TutorController;
//# sourceMappingURL=tutor.controller.js.map