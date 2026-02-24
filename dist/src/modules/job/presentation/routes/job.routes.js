"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJobRoutes = createJobRoutes;
const express_1 = require("express");
const auth_middleware_1 = require("../../../auth/auth.middleware");
const job_validation_1 = require("../middleware/job.validation");
function createJobRoutes(jobController) {
    const router = (0, express_1.Router)();
    router.use(auth_middleware_1.authenticate);
    router.get('/', (0, auth_middleware_1.authorizeRoles)('STUDENT', 'TUTOR', 'ADMIN'), (req, res) => jobController.getJobs(req, res));
    router.get('/statistics', (0, auth_middleware_1.authorizeRoles)('STUDENT', 'TUTOR', 'ADMIN'), (req, res) => jobController.getStatistics(req, res));
    router.get('/attention', (0, auth_middleware_1.authorizeRoles)('STUDENT', 'TUTOR', 'ADMIN'), (req, res) => jobController.getJobsNeedingAttention(req, res));
    router.get('/:id', (0, auth_middleware_1.authorizeRoles)('STUDENT', 'TUTOR', 'ADMIN'), (req, res) => jobController.getJob(req, res));
    router.post('/', (0, auth_middleware_1.authorizeRoles)('STUDENT', 'TUTOR'), job_validation_1.validateJobCreation, (req, res) => jobController.createJob(req, res));
    router.patch('/:id/status', (0, auth_middleware_1.authorizeRoles)('STUDENT', 'TUTOR', 'ADMIN'), job_validation_1.validateJobStatusUpdate, (req, res) => jobController.updateJobStatus(req, res));
    router.post('/:id/payment', (0, auth_middleware_1.authorizeRoles)('STUDENT', 'TUTOR'), (req, res) => jobController.processPayment(req, res));
    router.patch('/:id/payment-status', (0, auth_middleware_1.authorizeRoles)('ADMIN'), job_validation_1.validatePaymentStatusUpdate, (req, res) => jobController.updatePaymentStatus(req, res));
    router.delete('/:id', (0, auth_middleware_1.authorizeRoles)('STUDENT', 'TUTOR', 'ADMIN'), (req, res) => jobController.deleteJob(req, res));
    router.patch('/batch', (0, auth_middleware_1.authorizeRoles)('ADMIN'), (req, res) => jobController.batchUpdateJobs(req, res));
    return router;
}
exports.default = createJobRoutes;
//# sourceMappingURL=job.routes.js.map