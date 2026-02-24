"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const announcement_controller_1 = require("./announcement.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
router.get("/users", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('ADMIN'), admin_controller_1.AdminController.getAllUsers);
router.get("/stats", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('ADMIN'), admin_controller_1.AdminController.getPlatformStats);
router.post("/seed/tutors", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('ADMIN'), admin_controller_1.AdminController.seedTutors);
router.patch("/tutors/:tutorId/verify", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('ADMIN'), admin_controller_1.AdminController.verifyTutor);
router.get("/users/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('ADMIN'), admin_controller_1.AdminController.getUserById);
router.put("/users/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('ADMIN'), admin_controller_1.AdminController.updateUser);
router.delete("/users/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('ADMIN'), admin_controller_1.AdminController.deleteUser);
router.post("/announcements", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('ADMIN'), announcement_controller_1.AnnouncementController.create);
router.get("/announcements", auth_middleware_1.authenticate, announcement_controller_1.AnnouncementController.getAll);
router.delete("/announcements/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('ADMIN'), announcement_controller_1.AnnouncementController.delete);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map