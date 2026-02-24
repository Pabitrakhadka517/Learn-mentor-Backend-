"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("./auth.middleware");
const router = (0, express_1.Router)();
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 1000 : 100,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 5000 : 100,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/register', authLimiter, auth_controller_1.AuthController.register);
router.post('/register/user', authLimiter, auth_controller_1.AuthController.register);
router.post('/register/tutor', authLimiter, auth_controller_1.AuthController.register);
router.post('/login', authLimiter, auth_controller_1.AuthController.login);
router.post('/refresh', generalLimiter, auth_controller_1.AuthController.refresh);
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.AuthController.logout);
router.post('/forgot-password', authLimiter, auth_controller_1.AuthController.forgotPassword);
router.post('/reset-password', authLimiter, auth_controller_1.AuthController.resetPassword);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.AuthController.getCurrentUser);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map