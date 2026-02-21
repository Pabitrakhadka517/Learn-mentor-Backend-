"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
router.get("/users", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('ADMIN'), admin_controller_1.AdminController.getAllUsers);
router.get("/stats", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('ADMIN'), admin_controller_1.AdminController.getPlatformStats);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map