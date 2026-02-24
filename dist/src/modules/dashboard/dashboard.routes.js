"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const dashboard_controller_1 = require("./dashboard.controller");
const router = (0, express_1.Router)();
router.get('/student', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRole)('STUDENT'), dashboard_controller_1.DashboardController.getStudentStats);
router.get('/tutor', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRole)('TUTOR'), dashboard_controller_1.DashboardController.getTutorStats);
router.get('/admin', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRole)('ADMIN'), dashboard_controller_1.DashboardController.getAdminStats);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map