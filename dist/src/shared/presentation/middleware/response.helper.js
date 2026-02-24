"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.ResponseHelper = exports.InternalServerError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500, code, isOperational = true) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Error.captureStackTrace(this);
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = 'Bad Request', code) {
        super(message, 400, code);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', code) {
        super(message, 401, code || 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', code) {
        super(message, 403, code || 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', code) {
        super(message, 404, code || 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict', code) {
        super(message, 409, code || 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends AppError {
    constructor(message = 'Validation failed', code) {
        super(message, 422, code || 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
class InternalServerError extends AppError {
    constructor(message = 'Internal server error', code) {
        super(message, 500, code || 'INTERNAL_ERROR');
    }
}
exports.InternalServerError = InternalServerError;
class ResponseHelper {
    static success(res, data, message, statusCode = 200) {
        const response = {
            success: true,
            message,
            data,
            meta: {
                timestamp: new Date(),
                path: res.req.path,
                method: res.req.method
            }
        };
        return res.status(statusCode).json(response);
    }
    static error(res, message, statusCode = 500, code, details) {
        const response = {
            success: false,
            error: {
                message,
                code,
                details
            },
            meta: {
                timestamp: new Date(),
                path: res.req.path,
                method: res.req.method
            }
        };
        return res.status(statusCode).json(response);
    }
    static created(res, data, message = 'Resource created') {
        return this.success(res, data, message, 201);
    }
    static noContent(res) {
        return res.status(204).send();
    }
}
exports.ResponseHelper = ResponseHelper;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=response.helper.js.map