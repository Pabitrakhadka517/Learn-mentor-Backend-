"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const transaction_controller_1 = require("./transaction.controller");
const router = (0, express_1.Router)();
router.get('/bookings/transaction/:bookingId', auth_middleware_1.authenticate, transaction_controller_1.initBookingTransaction);
router.post('/bookings/transaction/:tId/pay', auth_middleware_1.authenticate, transaction_controller_1.payTransaction);
router.get('/jobs/transaction/:jobId', auth_middleware_1.authenticate, transaction_controller_1.initTransaction);
router.post('/jobs/transaction/:tId/pay', auth_middleware_1.authenticate, transaction_controller_1.payTransaction);
router.get('/transactions/sent', auth_middleware_1.authenticate, transaction_controller_1.getSenderTransactions);
router.get('/transactions/received', auth_middleware_1.authenticate, transaction_controller_1.getReceiverTransactions);
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map