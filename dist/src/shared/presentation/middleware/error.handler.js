"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleZodError = exports.notFoundHandler = exports.errorHandler = void 0;
const response_helper_1 = require("./response.helper");
const logger_service_1 = require("../../infrastructure/logging/logger.service");
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code = 'INTERNAL_ERROR';
    let details = undefined;
    logger_service_1.logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id
    });
    if (err instanceof response_helper_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code || 'APP_ERROR';
    }
    else if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Validation Error';
        code = 'VALIDATION_ERROR';
        details = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));
    }
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        code = 'VALIDATION_ERROR';
        details = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message
        }));
    }
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        code = 'INVALID_ID';
    }
    else if (err.name === 'MongoError' && err.code === 11000) {
        statusCode = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_RESOURCE';
    }
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    }
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            code,
            ...(details && { details }),
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        },
        meta: {
            timestamp: new Date(),
            path: req.path,
            method: req.method
        }
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            code: 'ROUTE_NOT_FOUND'
        },
        meta: {
            timestamp: new Date(),
            path: req.path,
            method: req.method
        }
    });
};
exports.notFoundHandler = notFoundHandler;
const handleZodError = (error) => {
    return {
        message: 'Validation failed',
        errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
        }))
    };
};
exports.handleZodError = handleZodError;
//# sourceMappingURL=error.handler.js.map