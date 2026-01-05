"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
router.post("/register", auth_controller_1.AuthController.register);
router.post("/register/admin", auth_controller_1.AuthController.registerAdmin);
router.post("/register/user", auth_controller_1.AuthController.registerUser);
router.post("/register/tutor", auth_controller_1.AuthController.registerTutor);
router.post("/login", auth_controller_1.AuthController.login);
router.post("/refresh", auth_controller_1.AuthController.refresh);
router.post("/logout", auth_middleware_1.authMiddleware, auth_controller_1.AuthController.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map