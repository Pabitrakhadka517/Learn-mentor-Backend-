import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
    booking: Types.ObjectId;
    tutor: Types.ObjectId;
    student: Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
    booking: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true
    },
    tutor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: 500
    }
}, { timestamps: true });

// Indexes
reviewSchema.index({ tutor: 1 });
reviewSchema.index({ student: 1 });
// booking already has a unique index via schema definition

export const Review = mongoose.models.Review || model<IReview>('Review', reviewSchema);
