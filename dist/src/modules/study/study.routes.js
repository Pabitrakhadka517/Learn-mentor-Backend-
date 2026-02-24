"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const study_controller_1 = require("./study.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const study_middleware_1 = require("./study.middleware");
const router = (0, express_1.Router)();
router.get('/', study_controller_1.StudyController.getResources);
router.get('/my', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('TUTOR', 'ADMIN'), study_controller_1.StudyController.getMyResources);
router.post('/upload', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('TUTOR', 'ADMIN'), study_middleware_1.uploadStudyResource, study_controller_1.StudyController.upload);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('TUTOR', 'ADMIN'), study_controller_1.StudyController.delete);
exports.default = router;
//# sourceMappingURL=study.routes.js.map