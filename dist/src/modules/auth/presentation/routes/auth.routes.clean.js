"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = createAuthRoutes;
const express_1 = require("express");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
function createAuthRoutes(authController) {
    const router = (0, express_1.Router)();
    router.post('/register', rate_limit_middleware_1.registrationRateLimit, (req, res) => authController.register(req, res));
    router.post('/login', rate_limit_middleware_1.loginRateLimit, (req, res) => authController.login(req, res));
    router.post('/refresh', rate_limit_middleware_1.tokenRefreshRateLimit, (req, res) => authController.refresh(req, res));
    router.post('/logout', rate_limit_middleware_1.authRateLimit, (req, res) => authController.logout(req, res));
    router.post('/forgot-password', rate_limit_middleware_1.passwordResetRateLimit, (req, res) => authController.forgotPassword(req, res));
    router.post('/reset-password', rate_limit_middleware_1.passwordResetRateLimit, (req, res) => authController.resetPassword(req, res));
    router.get('/profile', rate_limit_middleware_1.authRateLimit, (req, res) => authController.getProfile(req, res));
    router.post('/register/student', rate_limit_middleware_1.registrationRateLimit, (req, res) => {
        req.body.role = 'STUDENT';
        authController.register(req, res);
    });
    router.post('/register/tutor', rate_limit_middleware_1.registrationRateLimit, (req, res) => {
        req.body.role = 'TUTOR';
        authController.register(req, res);
    });
    return router;
}
exports.default = createAuthRoutes;
//# sourceMappingURL=auth.routes.clean.js.map