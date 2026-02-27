
import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { Booking } from './booking.model';
import { NotificationService } from '../notification/notification.service';
import { User } from '../auth/user.model';
import { TutorProfile } from '../tutor/tutor.model';

export class BookingController {

    /**
     * Create a new booking
     * Trigger: BOOKING_CREATED (Student -> Tutor)
     */
    /**
     * Create a new booking
     * Trigger: BOOKING_CREATED (Student -> Tutor)
     * Checks for double booking collisions
     */
    static async createBooking(req: AuthRequest, res: Response) {
        try {
            const studentId = req.user?.userId;
            const { tutorId, startTime, endTime, notes } = req.body;

            if (!studentId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            if (!tutorId || !startTime || !endTime) {
                return res.status(400).json({ success: false, message: 'Missing required booking details' });
            }

            // 1. Validation & ID Resolution
            let tutorUser = await User.findById(tutorId);
            let targetUserId = tutorId;

            if (!tutorUser) {
                // If not found by User ID, maybe it's a TutorProfile ID?
                const profile = await TutorProfile.findById(tutorId);
                if (profile) {
                    targetUserId = profile.user.toString();
                    tutorUser = await User.findById(targetUserId);
                }
            }

            if (!tutorUser || tutorUser.role !== 'TUTOR') {
                return res.status(404).json({ success: false, message: 'Tutor not found' });
            }

            const tutorProfile = await TutorProfile.findOne({ user: targetUserId });
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

            // 2. Prevent Double Booking
            // Check for overlaps: (StartA < EndB) AND (EndA > StartB)
            const conflict = await Booking.findOne({
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
                return res.status(409).json({
                    success: false,
                    message: 'This time slot is already booked. Please choose another time.'
                });
            }

            // 3. Calculate Price
            // Duration in hours
            const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            const price = (tutorProfile.hourlyRate || 0) * durationHours;

            // 4. Create Booking
            const booking = new Booking({
                student: studentId,
                tutor: targetUserId,
                startTime: start,
                endTime: end,
                price: price,
                notes: notes,
                status: 'PENDING',
                sessionStatus: 'booked',
                paymentStatus: 'pending'
            });

            await booking.save();

            // 5. Notify Tutor
            try {
                const student = await User.findById(studentId);
                await NotificationService.createNotification({
                    recipient: targetUserId,
                    sender: studentId,
                    type: 'BOOKING_CREATED',
                    message: `New booking request from ${student?.fullName || 'a student'} for ${start.toLocaleString()}`,
                    relatedId: booking._id
                });
            } catch (notifError) {
                console.error('Notification failed', notifError);
            }

            res.status(201).json({
                success: true,
                message: 'Booking request sent successfully!',
                booking
            });

        } catch (error: any) {
            console.error('Create booking error:', error);
            res.status(500).json({ success: false, message: error.message || 'Internal server error' });
        }
    }

    /**
     * Update Booking Status (Accept/Reject)
     * Trigger: BOOKING_UPDATED (Tutor -> Student)
     */
    static async updateBookingStatus(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const { bookingId } = req.params;
            const { status } = req.body; // ACCEPTED, REJECTED, etc.

            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }

            // Verify Tutor Ownership (Only tutor can accept/reject generally)
            // Or Admin, but let's assume Tutor for now logic
            if (booking.tutor.toString() !== userId) {
                return res.status(403).json({ message: 'Unauthorized action on booking' });
            }

            const updateQuery: any = { $set: { status } };
            if (status === 'CONFIRMED' || status === 'ACCEPTED') {
                updateQuery.$set.sessionStatus = 'confirmed';
            } else if (status === 'REJECTED') {
                updateQuery.$set.sessionStatus = 'cancelled';
            }

            const updatedBooking = await Booking.findByIdAndUpdate(
                bookingId,
                updateQuery,
                { new: true, runValidators: false } // Avoid 'startTime' required bug
            );

            if (!updatedBooking) {
                return res.status(500).json({ message: 'Failed to update booking status' });
            }

            // Notify Student
            try {
                await NotificationService.createNotification({
                    recipient: booking.student,
                    sender: userId, // Tutor
                    type: 'BOOKING_UPDATED',
                    message: `Your booking has been ${status.toLowerCase()}`,
                    relatedId: booking._id
                });
            } catch (notifError) {
                console.error('Notification failed', notifError);
            }

            res.json({
                success: true,
                message: `Booking ${status.toLowerCase()} successfully`,
                booking: updatedBooking
            });

        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get bookings for logged-in user (Student or Tutor)
     */
    static async getBookings(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ message: 'Unauthorized' });

            const { status } = req.query;
            const role = req.user?.role;
            const query: any = role === 'STUDENT' ? { student: userId } : { tutor: userId };

            if (status && status !== 'all') {
                query.status = status;
            }

            const bookings = await Booking.find(query)
                .populate('student', 'fullName profileImage')
                .populate('tutor', 'fullName profileImage')
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                bookings
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    /**
     * Mark booking as COMPLETED
     * Only Tutor can do this
     */
    static async completeBooking(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;

            const booking = await Booking.findById(id);
            if (!booking) return res.status(404).json({ message: 'Booking not found' });

            if (booking.tutor.toString() !== userId && booking.student.toString() !== userId) {
                return res.status(403).json({ message: 'Unauthorized: Only parties involved in the booking can complete it' });
            }

            // Accept either paymentStatus='paid' or status='PAID' as proof of payment
            if (booking.paymentStatus !== 'paid' && booking.status !== 'PAID') {
                return res.status(400).json({ 
                    message: 'Payment has not been completed for this session. Please pay first.',
                    requiresPayment: true 
                });
            }

            const updatedBooking = await Booking.findByIdAndUpdate(id,
                { 
                    $set: { 
                        status: 'COMPLETED',
                        sessionStatus: 'completed',
                        paymentStatus: 'paid' // Ensure consistency
                    } 
                },
                { new: true, runValidators: false }
            );

            // Notify other party
            const recipient = booking.student.toString() === userId ? booking.tutor : booking.student;
            const completerRole = userId === booking.student.toString() ? 'Student' : 'Tutor';

            try {
                await NotificationService.createNotification({
                    recipient: recipient,
                    sender: userId,
                    type: 'BOOKING_UPDATED',
                    message: `The session was marked as COMPLETED by the ${completerRole.toLowerCase()}.`,
                    relatedId: booking._id
                });
            } catch (notifError) {
                console.error('Notification failed', notifError);
            }

            res.json({ success: true, message: 'Booking completed', booking: updatedBooking });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Cancel Booking
     * Student or Tutor
     */
    static async cancelBooking(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;

            const booking = await Booking.findById(id);
            if (!booking) return res.status(404).json({ message: 'Booking not found' });

            if (booking.student.toString() !== userId && booking.tutor.toString() !== userId) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            if (booking.status === 'COMPLETED') {
                return res.status(400).json({ message: 'Cannot cancel a completed booking' });
            }

            const updatedBooking = await Booking.findByIdAndUpdate(id,
                { 
                    $set: { 
                        status: 'CANCELLED',
                        sessionStatus: 'cancelled'
                    } 
                },
                { new: true, runValidators: false }
            );

            // Notify other party
            const recipient = booking.student.toString() === userId ? booking.tutor : booking.student;
            try {
                await NotificationService.createNotification({
                    recipient: recipient,
                    sender: userId,
                    type: 'BOOKING_UPDATED',
                    message: `Booking has been CANCELLED by ${req.user?.role === 'STUDENT' ? 'student' : 'tutor'}`,
                    relatedId: booking._id
                });
            } catch (notifError) {
                console.error('Notification failed', notifError);
            }

            res.json({ success: true, message: 'Booking cancelled', booking: updatedBooking });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Update Booking Details (Edit)
     * Student can edit PENDING bookings
     */
    static async updateBooking(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            const { startTime, endTime, notes } = req.body;

            const booking = await Booking.findById(id);
            if (!booking) return res.status(404).json({ message: 'Booking not found' });

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

            // Conflict check (exclude this booking)
            const conflict = await Booking.findOne({
                _id: { $ne: id },
                tutor: booking.tutor,
                status: { $in: ['PENDING', 'CONFIRMED', 'ACCEPTED', 'PAID'] },
                startTime: { $lt: end },
                endTime: { $gt: start }
            });

            if (conflict) {
                return res.status(409).json({ message: 'New time slot conflicts with an existing booking' });
            }

            // Recalculate price if duration changed
            let price = booking.price; // Default to current price
            const tutorProfile = await TutorProfile.findOne({ user: booking.tutor });
            if (tutorProfile) {
                const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                price = (tutorProfile.hourlyRate || 0) * durationHours;
            }

            const updatedBooking = await Booking.findByIdAndUpdate(
                id,
                {
                    $set: {
                        startTime: start,
                        endTime: end,
                        price: price,
                        notes: notes !== undefined ? notes : booking.notes
                    }
                },
                { new: true, runValidators: false }
            );

            // Notify tutor about update
            try {
                const student = await User.findById(userId);
                await NotificationService.createNotification({
                    recipient: booking.tutor.toString(),
                    sender: userId,
                    type: 'BOOKING_UPDATED',
                    message: `Booking request updated by ${student?.fullName || 'student'} for ${start.toLocaleString()}`,
                    relatedId: booking._id
                });
            } catch (notifError) {
                console.error('Notification failed', notifError);
            }

            res.json({ success: true, message: 'Booking updated successfully', booking });
        } catch (error: any) {
            console.error('Update booking error:', error);
            res.status(500).json({ message: error.message });
        }
    }
}
