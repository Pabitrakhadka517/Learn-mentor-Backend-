"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("./profile.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const profile_middleware_1 = require("./profile.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, profile_controller_1.ProfileController.getProfile);
router.put('/', auth_middleware_1.authMiddleware, profile_middleware_1.uploadProfileImage, profile_controller_1.ProfileController.updateProfile);
router.delete('/image', auth_middleware_1.authMiddleware, profile_controller_1.ProfileController.deleteProfileImage);
exports.default = router;
//# sourceMappingURL=profile.routes.js.map