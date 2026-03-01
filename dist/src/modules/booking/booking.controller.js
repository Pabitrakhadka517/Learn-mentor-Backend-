"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const booking_model_1 = require("./booking.model");
const notification_service_1 = require("../notification/notification.service");
const user_model_1 = require("../auth/user.model");
const tutor_model_1 = require("../tutor/tutor.model");
const socket_1 = require("../../socket");
class BookingController {
    static async resolveTutorUserId(identifier) {
        const tutorUser = await user_model_1.User.findById(identifier);
        if (tutorUser?.role === 'TUTOR') {
            return String(tutorUser._id);
        }
        const profile = await tutor_model_1.TutorProfile.findById(identifier);
        if (profile) {
            return profile.user.toString();
        }
        return null;
    }
    static emitAvailabilityUpdated(tutorId) {
        if (!socket_1.io) {
            return;
        }
        socket_1.io.to(`availability:${tutorId}`).emit('availability_updated', {
            tutorId,
            updatedAt: new Date().toISOString()
        });
    }
    static async releaseAvailabilitySlot(booking) {
        if (!booking?.availabilitySlot) {
            return;
        }
        await tutor_model_1.AvailabilitySlot.findOneAndUpdate({
            _id: booking.availabilitySlot,
            tutorId: booking.tutor,
            startTime: booking.startTime,
            endTime: booking.endTime,
            isBooked: true
        }, {
            $set: { isBooked: false }
        });
        BookingController.emitAvailabilityUpdated(String(booking.tutor));
    }
    static async createBooking(req, res) {
        try {
            const studentId = req.user?.userId;
            const { tutorId, startTime, endTime, notes } = req.body;
            if (!studentId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }
            if (!tutorId || !startTime || !endTime) {
                return res.status(400).json({ success: false, message: 'Missing required booking details' });
            }
            const targetUserId = await BookingController.resolveTutorUserId(tutorId);
            if (!targetUserId) {
                return res.status(404).json({ success: false, message: 'Tutor not found' });
            }
            const tutorProfile = await tutor_model_1.TutorProfile.findOne({ user: targetUserId });
            if (!tutorProfile) {
                return res.status(404).json({ success: false, message: 'Tutor profile not found' });
            }
            const start = new Date(startTime);
            const end = new Date(endTime);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid date/time format' });
            }
            if (start >= end) {
                return res.status(400).json({ success: false, message: 'End time must be after start time' });
            }
            if (start < new Date()) {
                return res.status(400).json({ success: false, message: 'Cannot book sessions in the past' });
            }
            const availabilitySlot = await tutor_model_1.AvailabilitySlot.findOneAndUpdate({
                tutorId: targetUserId,
                startTime: start,
                endTime: end,
                isBooked: false
            }, {
                $set: { isBooked: true }
            }, {
                new: true
            });
            if (!availabilitySlot) {
                return res.status(409).json({
                    success: false,
                    message: 'This slot is no longer available. Please refresh and choose another slot.'
                });
            }
            const conflict = await booking_model_1.Booking.findOne({
                tutor: targetUserId,
                status: { $in: ['PENDING', 'CONFIRMED', 'ACCEPTED', 'PAID'] },
                $or: [
                    {
                        startTime: { $lt: end },
                        endTime: { $gt: start }
                    }
                ]
            });
            if (conflict) {
                await tutor_model_1.AvailabilitySlot.findByIdAndUpdate(availabilitySlot._id, { $set: { isBooked: false } });
                return res.status(409).json({
                    success: false,
                    message: 'This time slot is already booked. Please choose another time.'
                });
            }
            const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            const price = (tutorProfile.hourlyRate || 0) * durationHours;
            const booking = new booking_model_1.Booking({
                student: studentId,
                tutor: targetUserId,
                availabilitySlot: availabilitySlot._id,
                startTime: start,
                endTime: end,
                price: price,
                notes: notes,
                status: 'PENDING',
                sessionStatus: 'booked',
                paymentStatus: 'pending'
            });
            await booking.save();
            BookingController.emitAvailabilityUpdated(targetUserId);
            try {
                const student = await user_model_1.User.findById(studentId);
                await notification_service_1.NotificationService.createNotification({
                    recipient: targetUserId,
                    sender: studentId,
                    type: 'BOOKING_CREATED',
                    message: `New booking request from ${student?.fullName || 'a student'} for ${start.toLocaleString()}`,
                    relatedId: booking._id
                });
            }
            catch (notifError) {
                console.error('Notification failed', notifError);
            }
            res.status(201).json({
                success: true,
                message: 'Booking request sent successfully!',
                booking
            });
        }
        catch (error) {
            console.error('Create booking error:', error);
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    }
    static async updateBookingStatus(req, res) {
        try {
            const userId = req.user?.userId;
            const { bookingId } = req.params;
            const { status } = req.body;
            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }
            const booking = await booking_model_1.Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            if (booking.tutor.toString() !== userId) {
                return res.status(403).json({ message: 'Unauthorized action on booking' });
            }
            const updateQuery = { $set: { status } };
            if (status === 'CONFIRMED' || status === 'ACCEPTED') {
                updateQuery.$set.sessionStatus = 'confirmed';
            }
            else if (status === 'REJECTED') {
                updateQuery.$set.sessionStatus = 'cancelled';
                await BookingController.releaseAvailabilitySlot(booking);
            }
            const updatedBooking = await booking_model_1.Booking.findByIdAndUpdate(bookingId, updateQuery, { new: true, runValidators: false });
            if (!updatedBooking) {
                return res.status(500).json({ message: 'Failed to update booking status' });
            }
            try {
                await notification_service_1.NotificationService.createNotification({
                    recipient: booking.student,
                    sender: userId,
                    type: 'BOOKING_UPDATED',
                    message: `Your booking has been ${status.toLowerCase()}`,
                    relatedId: booking._id
                });
            }
            catch (notifError) {
                console.error('Notification failed', notifError);
            }
            res.json({
                success: true,
                message: `Booking ${status.toLowerCase()} successfully`,
                booking: updatedBooking
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async getBookings(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId)
                return res.status(401).json({ message: 'Unauthorized' });
            const { status } = req.query;
            const role = req.user?.role;
            const query = role === 'STUDENT' ? { student: userId } : { tutor: userId };
            if (status && status !== 'all') {
                query.status = status;
            }
            const bookings = await booking_model_1.Booking.find(query)
                .populate('student', 'fullName profileImage')
                .populate('tutor', 'fullName profileImage')
                .sort({ createdAt: -1 });
            res.json({
                success: true,
                bookings
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async completeBooking(req, res) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            const booking = await booking_model_1.Booking.findById(id);
            if (!booking)
                return res.status(404).json({ message: 'Booking not found' });
            if (booking.tutor.toString() !== userId && booking.student.toString() !== userId) {
                return res.status(403).json({ message: 'Unauthorized: Only parties involved in the booking can complete it' });
            }
            if (booking.paymentStatus !== 'paid' && booking.status !== 'PAID') {
                return res.status(400).json({
                    message: 'Payment has not been completed for this session. Please pay first.',
                    requiresPayment: true
                });
            }
            const updatedBooking = await booking_model_1.Booking.findByIdAndUpdate(id, {
                $set: {
                    status: 'COMPLETED',
                    sessionStatus: 'completed',
                    paymentStatus: 'paid'
                }
            }, { new: true, runValidators: false });
            const recipient = booking.student.toString() === userId ? booking.tutor : booking.student;
            const completerRole = userId === booking.student.toString() ? 'Student' : 'Tutor';
            try {
                await notification_service_1.NotificationService.createNotification({
                    recipient: recipient,
                    sender: userId,
                    type: 'BOOKING_UPDATED',
                    message: `The session was marked as COMPLETED by the ${completerRole.toLowerCase()}.`,
                    relatedId: booking._id
                });
            }
            catch (notifError) {
                console.error('Notification failed', notifError);
            }
            res.json({ success: true, message: 'Booking completed', booking: updatedBooking });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async cancelBooking(req, res) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            const booking = await booking_model_1.Booking.findById(id);
            if (!booking)
                return res.status(404).json({ message: 'Booking not found' });
            if (booking.student.toString() !== userId && booking.tutor.toString() !== userId) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
            if (booking.status === 'COMPLETED') {
                return res.status(400).json({ message: 'Cannot cancel a completed booking' });
            }
            const updatedBooking = await booking_model_1.Booking.findByIdAndUpdate(id, {
                $set: {
                    status: 'CANCELLED',
                    sessionStatus: 'cancelled'
                }
            }, { new: true, runValidators: false });
            await BookingController.releaseAvailabilitySlot(booking);
            const recipient = booking.student.toString() === userId ? booking.tutor : booking.student;
            try {
                await notification_service_1.NotificationService.createNotification({
                    recipient: recipient,
                    sender: userId,
                    type: 'BOOKING_UPDATED',
                    message: `Booking has been CANCELLED by ${req.user?.role === 'STUDENT' ? 'student' : 'tutor'}`,
                    relatedId: booking._id
                });
            }
            catch (notifError) {
                console.error('Notification failed', notifError);
            }
            res.json({ success: true, message: 'Booking cancelled', booking: updatedBooking });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async updateBooking(req, res) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            const { startTime, endTime, notes } = req.body;
            const booking = await booking_model_1.Booking.findById(id);
            if (!booking)
                return res.status(404).json({ message: 'Booking not found' });
            if (booking.student.toString() !== userId) {
                return res.status(403).json({ message: 'Only the student can edit this booking' });
            }
            if (booking.status !== 'PENDING') {
                return res.status(400).json({ message: 'Only pending bookings can be edited' });
            }
            const start = new Date(startTime);
            const end = new Date(endTime);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ message: 'Invalid date/time format' });
            }
            const conflict = await booking_model_1.Booking.findOne({
                _id: { $ne: id },
                tutor: booking.tutor,
                status: { $in: ['PENDING', 'CONFIRMED', 'ACCEPTED', 'PAID'] },
                startTime: { $lt: end },
                endTime: { $gt: start }
            });
            if (conflict) {
                return res.status(409).json({ message: 'New time slot conflicts with an existing booking' });
            }
            const newSlot = await tutor_model_1.AvailabilitySlot.findOneAndUpdate({
                tutorId: booking.tutor,
                startTime: start,
                endTime: end,
                isBooked: false
            }, {
                $set: { isBooked: true }
            }, { new: true });
            if (!newSlot) {
                return res.status(409).json({ message: 'Selected slot is no longer available. Please refresh.' });
            }
            let price = booking.price;
            const tutorProfile = await tutor_model_1.TutorProfile.findOne({ user: booking.tutor });
            if (tutorProfile) {
                const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                price = (tutorProfile.hourlyRate || 0) * durationHours;
            }
            const updatedBooking = await booking_model_1.Booking.findByIdAndUpdate(id, {
                $set: {
                    startTime: start,
                    endTime: end,
                    availabilitySlot: newSlot._id,
                    price: price,
                    notes: notes !== undefined ? notes : booking.notes
                }
            }, { new: true, runValidators: false });
            await BookingController.releaseAvailabilitySlot(booking);
            BookingController.emitAvailabilityUpdated(String(booking.tutor));
            try {
                const student = await user_model_1.User.findById(userId);
                await notification_service_1.NotificationService.createNotification({
                    recipient: booking.tutor.toString(),
                    sender: userId,
                    type: 'BOOKING_UPDATED',
                    message: `Booking request updated by ${student?.fullName || 'student'} for ${start.toLocaleString()}`,
                    relatedId: booking._id
                });
            }
            catch (notifError) {
                console.error('Notification failed', notifError);
            }
            res.json({ success: true, message: 'Booking updated successfully', booking: updatedBooking });
        }
        catch (error) {
            console.error('Update booking error:', error);
            res.status(500).json({ message: error.message });
        }
    }
}
exports.BookingController = BookingController;
//# sourceMappingURL=booking.controller.js.map