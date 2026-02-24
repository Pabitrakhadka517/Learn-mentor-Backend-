import { Response, NextFunction } from 'express';
import expressValidator from 'express-validator';
const { body, param, validationResult } = expressValidator as any;
import { JobStatus, PaymentStatus } from '../../domain/entities/job.entity';
import { Types } from 'mongoose';
import { AuthRequest } from '../../../auth/auth.middleware';

/**
 * Validation middleware for job creation
 */
export const validateJobCreation = [
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
    .custom((value: any) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('Invalid receiver ID format');
      }
      return true;
    }),
    
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0')
    .custom((value: any) => {
      if (value > 10000) {
        throw new Error('Amount cannot exceed $10,000');
      }
      return true;
    }),

  // Handle validation errors
  (req: AuthRequest, res: Response, next: NextFunction) => {
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

/**
 * Validation middleware for job status updates
 */
export const validateJobStatusUpdate = [
  param('id')
    .custom((value: any) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('Invalid job ID format');
      }
      return true;
    }),
    
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'active', 'finished', 'cancelled'])
    .withMessage('Invalid job status'),

  // Handle validation errors
  (req: AuthRequest, res: Response, next: NextFunction) => {
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

/**
 * Validation middleware for payment status updates
 */
export const validatePaymentStatusUpdate = [
  param('id')
    .custom((value: any) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('Invalid job ID format');
      }
      return true;
    }),
    
  body('paymentStatus')
    .notEmpty()
    .withMessage('Payment status is required')
    .isIn(['pending', 'done', 'failed'])
    .withMessage('Invalid payment status'),

  // Handle validation errors
  (req: AuthRequest, res: Response, next: NextFunction) => {
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

/**
 * Validation middleware for batch operations
 */
export const validateBatchUpdate = [
  body('jobIds')
    .isArray({ min: 1 })
    .withMessage('Job IDs array is required and must not be empty')
    .custom((jobIds: any) => {
      for (const id of jobIds) {
        if (!Types.ObjectId.isValid(id)) {
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

  // Handle validation errors
  (req: AuthRequest, res: Response, next: NextFunction) => {
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

/**
 * Validation for query parameters
 */
export const validateJobQuery = [
  // Status filter validation
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.query.status && !['pending', 'active', 'finished', 'cancelled'].includes(req.query.status as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status filter value'
      });
    }
    next();
  },
  
  // Payment status filter validation
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.query.paymentStatus && !['pending', 'done', 'failed'].includes(req.query.paymentStatus as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status filter value'
      });
    }
    next();
  },
  
  // Role filter validation
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.query.role && !['sender', 'receiver'].includes(req.query.role as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role filter value'
      });
    }
    next();
  },
  
  // Date range validation
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.query.dateFrom) {
      const dateFrom = new Date(req.query.dateFrom as string);
      if (isNaN(dateFrom.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dateFrom format. Use ISO date string.'
        });
      }
    }
    
    if (req.query.dateTo) {
      const dateTo = new Date(req.query.dateTo as string);
      if (isNaN(dateTo.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dateTo format. Use ISO date string.'
        });
      }
    }
    
    // Validate date range
    if (req.query.dateFrom && req.query.dateTo) {
      const dateFrom = new Date(req.query.dateFrom as string);
      const dateTo = new Date(req.query.dateTo as string);
      
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

/**
 * Custom validation for receiver ID to ensure it's different from sender
 */
export const validateReceiverDifferentFromSender = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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

/**
 * Validation for payment processing
 */
export const validatePaymentProcessing = [
  param('id')
    .custom((value: any) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('Invalid job ID format');
      }
      return true;
    }),

  // Handle validation errors
  (req: AuthRequest, res: Response, next: NextFunction) => {
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

