
import { Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { AuthRequest } from '../auth/auth.middleware';
import { Review } from './review.model';
import { Booking } from '../booking/booking.model';
import { TutorProfile } from '../tutor/tutor.model';
import { NotificationService } from '../notification/notification.service';

/**
 * Create a new review
 * POST /reviews/:bookingId
 */
export const createReview = async (req: AuthRequest, res: Response) => {
    try {
        const { bookingId } = req.params;
        const { rating, comment } = req.body;
        const studentId = req.user?.userId;

        if (!studentId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Validate Rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // 1. Verify Booking Exists and Belongs to Student
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.student.toString() !== studentId) {
            return res.status(403).json({ message: 'You are not authorized to review this booking' });
        }

        // 2. Verify Booking is Completed
        // Reviews are only allowed if the session status is COMPLETED
        if (booking.status !== 'COMPLETED') {
            return res.status(400).json({ message: 'Cannot review booking that is not completed' });
        }

        // 3. Check if Review Already Exists
        // Although model has unique index, good to check explicitly for clear error
        const existingReview = await Review.findOne({ booking: bookingId });
        if (existingReview) {
            return res.status(400).json({ message: 'Review already exists for this booking' });
        }

        // 4. Create Review
        const review = new Review({
            booking: booking._id,
            tutor: booking.tutor,
            student: studentId,
            rating,
            comment
        });
        await review.save();

        // 5. Update Tutor Stats (Atomic Recalculation)
        // newAverage = (oldAverage * totalReviews + newRating) / (totalReviews + 1)

        // Fetch Tutor Profile to get current stats
        const tutorProfile = await TutorProfile.findOne({ user: booking.tutor });
        if (tutorProfile) {
            const currentTotal = tutorProfile.totalReviews || 0;
            const currentAvg = tutorProfile.averageRating || 0;

            const newTotal = currentTotal + 1;
            const newAvg = ((currentAvg * currentTotal) + rating) / newTotal;

            // Update Tutor Profile
            // We also update the existing 'rating' and 'reviewsCount' fields to keep them in sync if used elsewhere
            tutorProfile.totalReviews = newTotal;
            tutorProfile.averageRating = Number(newAvg.toFixed(2)); // Round to 2 decimals
            tutorProfile.reviewsCount = newTotal;
            tutorProfile.rating = Number(newAvg.toFixed(2)); // Sync legacy field

            await tutorProfile.save();
        }

        // 6. Notify Tutor
        try {
            await NotificationService.createNotification({
                recipient: booking.tutor,
                sender: studentId,
                type: 'NEW_REVIEW',
                message: `You received a ${rating}-star review from a student!`,
                relatedId: review._id
            });
        } catch (notifError) {
            console.error('Notification failed', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review
        });

    } catch (error: any) {
        console.error('Create Review Error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Tutor Reviews
 * GET /reviews/tutor/:tutorId
 */
export const getTutorReviews = async (req: AuthRequest, res: Response) => {
    try {
        const { tutorId } = req.params;

        // Verify tutor exists (optional but good practice)
        // Or just query reviews directly. 
        // We need to return average rating and total count as header info potentially, 
        // or just the list. Prompt says "Return average rating and total review count".

        // Let's get the profile stats first
        const tutorProfile = await TutorProfile.findOne({ user: tutorId });

        const reviews = await Review.find({ tutor: tutorId })
            .populate('student', 'fullName profileImage') // Populate student name (and image for UI)
            .sort({ createdAt: -1 }); // Newest first

        res.json({
            success: true,
            averageRating: tutorProfile ? tutorProfile.averageRating : 0,
            totalReviews: tutorProfile ? tutorProfile.totalReviews : 0,
            reviews
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
