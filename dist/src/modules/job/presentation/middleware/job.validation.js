"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePaymentProcessing = exports.validateReceiverDifferentFromSender = exports.validateJobQuery = exports.validateBatchUpdate = exports.validatePaymentStatusUpdate = exports.validateJobStatusUpdate = exports.validateJobCreation = void 0;
const express_validator_1 = __importDefault(require("express-validator"));
const { body, param, validationResult } = express_validator_1.default;
const mongoose_1 = require("mongoose");
exports.validateJobCreation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    body('receiverId')
        .notEmpty()
        .withMessage('Receiver ID is required')
        .custom((value) => {
        if (!mongoose_1.Types.ObjectId.isValid(value)) {
            throw new Error('Invalid receiver ID format');
        }
        return true;
    }),
    body('amount')
        .isNumeric()
        .withMessage('Amount must be a number')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0')
        .custom((value) => {
        if (value > 10000) {
            throw new Error('Amount cannot exceed $10,000');
        }
        return true;
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];
exports.validateJobStatusUpdate = [
    param('id')
        .custom((value) => {
        if (!mongoose_1.Types.ObjectId.isValid(value)) {
            throw new Error('Invalid job ID format');
        }
        return true;
    }),
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['pending', 'active', 'finished', 'cancelled'])
        .withMessage('Invalid job status'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];
exports.validatePaymentStatusUpdate = [
    param('id')
        .custom((value) => {
        if (!mongoose_1.Types.ObjectId.isValid(value)) {
            throw new Error('Invalid job ID format');
        }
        return true;
    }),
    body('paymentStatus')
        .notEmpty()
        .withMessage('Payment status is required')
        .isIn(['pending', 'done', 'failed'])
        .withMessage('Invalid payment status'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];
exports.validateBatchUpdate = [
    body('jobIds')
        .isArray({ min: 1 })
        .withMessage('Job IDs array is required and must not be empty')
        .custom((jobIds) => {
        for (const id of jobIds) {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                throw new Error(`Invalid job ID format: ${id}`);
            }
        }
        return true;
    }),
    body('updateData')
        .isObject()
        .withMessage('Update data must be an object'),
    body('updateData.status')
        .optional()
        .isIn(['pending', 'active', 'finished', 'cancelled'])
        .withMessage('Invalid job status in update data'),
    body('updateData.paymentStatus')
        .optional()
        .isIn(['pending', 'done', 'failed'])
        .withMessage('Invalid payment status in update data'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];
exports.validateJobQuery = [
    (req, res, next) => {
        if (req.query.status && !['pending', 'active', 'finished', 'cancelled'].includes(req.query.status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status filter value'
            });
        }
        next();
    },
    (req, res, next) => {
        if (req.query.paymentStatus && !['pending', 'done', 'failed'].includes(req.query.paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status filter value'
            });
        }
        next();
    },
    (req, res, next) => {
        if (req.query.role && !['sender', 'receiver'].includes(req.query.role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role filter value'
            });
        }
        next();
    },
    (req, res, next) => {
        if (req.query.dateFrom) {
            const dateFrom = new Date(req.query.dateFrom);
            if (isNaN(dateFrom.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid dateFrom format. Use ISO date string.'
                });
            }
        }
        if (req.query.dateTo) {
            const dateTo = new Date(req.query.dateTo);
            if (isNaN(dateTo.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid dateTo format. Use ISO date string.'
                });
            }
        }
        if (req.query.dateFrom && req.query.dateTo) {
            const dateFrom = new Date(req.query.dateFrom);
            const dateTo = new Date(req.query.dateTo);
            if (dateFrom > dateTo) {
                return res.status(400).json({
                    success: false,
                    message: 'dateFrom cannot be later than dateTo'
                });
            }
        }
        next();
    }
];
const validateReceiverDifferentFromSender = (req, res, next) => {
    const senderId = req.user?.userId;
    const receiverId = req.body.receiverId;
    if (senderId === receiverId) {
        return res.status(400).json({
            success: false,
            message: 'Cannot create a job for yourself'
        });
    }
    next();
};
exports.validateReceiverDifferentFromSender = validateReceiverDifferentFromSender;
exports.validatePaymentProcessing = [
    param('id')
        .custom((value) => {
        if (!mongoose_1.Types.ObjectId.isValid(value)) {
            throw new Error('Invalid job ID format');
        }
        return true;
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];
//# sourceMappingURL=job.validation.js.map