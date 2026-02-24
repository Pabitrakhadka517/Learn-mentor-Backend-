"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTutorReviews = exports.createReview = void 0;
const review_model_1 = require("./review.model");
const booking_model_1 = require("../booking/booking.model");
const tutor_model_1 = require("../tutor/tutor.model");
const notification_service_1 = require("../notification/notification.service");
const createReview = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { rating, comment } = req.body;
        const studentId = req.user?.userId;
        if (!studentId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }
        const booking = await booking_model_1.Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        if (booking.student.toString() !== studentId) {
            return res.status(403).json({ message: 'You are not authorized to review this booking' });
        }
        if (booking.status !== 'COMPLETED') {
            return res.status(400).json({ message: 'Cannot review booking that is not completed' });
        }
        const existingReview = await review_model_1.Review.findOne({ booking: bookingId });
        if (existingReview) {
            return res.status(400).json({ message: 'Review already exists for this booking' });
        }
        const review = new review_model_1.Review({
            booking: booking._id,
            tutor: booking.tutor,
            student: studentId,
            rating,
            comment
        });
        await review.save();
        const tutorProfile = await tutor_model_1.TutorProfile.findOne({ user: booking.tutor });
        if (tutorProfile) {
            const currentTotal = tutorProfile.totalReviews || 0;
            const currentAvg = tutorProfile.averageRating || 0;
            const newTotal = currentTotal + 1;
            const newAvg = ((currentAvg * currentTotal) + rating) / newTotal;
            tutorProfile.totalReviews = newTotal;
            tutorProfile.averageRating = Number(newAvg.toFixed(2));
            tutorProfile.reviewsCount = newTotal;
            tutorProfile.rating = Number(newAvg.toFixed(2));
            await tutorProfile.save();
        }
        try {
            await notification_service_1.NotificationService.createNotification({
                recipient: booking.tutor,
                sender: studentId,
                type: 'NEW_REVIEW',
                message: `You received a ${rating}-star review from a student!`,
                relatedId: review._id
            });
        }
        catch (notifError) {
            console.error('Notification failed', notifError);
        }
        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review
        });
    }
    catch (error) {
        console.error('Create Review Error:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.createReview = createReview;
const getTutorReviews = async (req, res) => {
    try {
        const { tutorId } = req.params;
        const tutorProfile = await tutor_model_1.TutorProfile.findOne({ user: tutorId });
        const reviews = await review_model_1.Review.find({ tutor: tutorId })
            .populate('student', 'fullName profileImage')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            averageRating: tutorProfile ? tutorProfile.averageRating : 0,
            totalReviews: tutorProfile ? tutorProfile.totalReviews : 0,
            reviews
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getTutorReviews = getTutorReviews;
//# sourceMappingURL=review.controller.js.map