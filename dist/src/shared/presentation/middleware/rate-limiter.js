"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictRateLimiter = exports.apiRateLimiter = exports.authRateLimiter = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const createRateLimiter = (options) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options?.windowMs || 15 * 60 * 1000,
        max: options?.max || 100,
        message: options?.message || 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                error: {
                    message: options?.message || 'Too many requests, please try again later.',
                    code: 'RATE_LIMIT_EXCEEDED'
                }
            });
        }
    });
};
exports.createRateLimiter = createRateLimiter;
exports.authRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later.'
});
exports.apiRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 100
});
exports.strictRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Rate limit exceeded. Please slow down your requests.'
});
//# sourceMappingURL=rate-limiter.js.map