"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const review_controller_1 = require("./review.controller");
const router = (0, express_1.Router)();
router.post('/:bookingId', auth_middleware_1.authenticate, review_controller_1.createReview);
router.get('/tutor/:tutorId', review_controller_1.getTutorReviews);
exports.default = router;
//# sourceMappingURL=review.routes.js.map