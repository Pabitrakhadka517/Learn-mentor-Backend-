"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tutor_controller_1 = require("./tutor.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('STUDENT', 'ADMIN', 'TUTOR'), tutor_controller_1.TutorController.getTutors);
router.get('/my/availability', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('TUTOR'), tutor_controller_1.TutorController.getMyAvailability);
router.post('/my/availability', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('TUTOR'), tutor_controller_1.TutorController.setMyAvailability);
router.post('/my/verify/submit', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('TUTOR'), tutor_controller_1.TutorController.submitVerification);
router.get('/:id/availability', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('STUDENT', 'ADMIN', 'TUTOR'), tutor_controller_1.TutorController.getTutorAvailability);
router.get('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('STUDENT', 'ADMIN', 'TUTOR'), tutor_controller_1.TutorController.getTutorById);
exports.default = router;
//# sourceMappingURL=tutor.routes.js.map