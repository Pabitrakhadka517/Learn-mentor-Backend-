"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const booking_controller_1 = require("./booking.controller");
const router = (0, express_1.Router)();
router.post('/book', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('STUDENT'), booking_controller_1.BookingController.createBooking);
router.get('/', auth_middleware_1.authenticate, booking_controller_1.BookingController.getBookings);
router.patch('/:bookingId/status', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('TUTOR', 'ADMIN'), booking_controller_1.BookingController.updateBookingStatus);
router.patch('/:id/complete', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('TUTOR', 'STUDENT'), booking_controller_1.BookingController.completeBooking);
router.patch('/:id/cancel', auth_middleware_1.authenticate, booking_controller_1.BookingController.cancelBooking);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)('STUDENT'), booking_controller_1.BookingController.updateBooking);
exports.default = router;
//# sourceMappingURL=booking.routes.js.map