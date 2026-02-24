import mongoose, { Schema, model, Document, Types } from 'mongoose';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface ITutorProfile extends Document {
    user: Types.ObjectId;
    bio: string;
    experienceYears: number;
    hourlyRate: number;
    languages: string[];
    subjects: string[];
    verificationStatus: VerificationStatus;
    totalClasses: number;
    rating: number;
    reviewsCount: number;
    averageRating: number;
    totalReviews: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAvailabilitySlot extends Document {
    tutorId: Types.ObjectId;
    startTime: Date;
    endTime: Date;
    isBooked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const tutorProfileSchema = new Schema<ITutorProfile>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    bio: { type: String, default: '' },
    experienceYears: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 0 },
    languages: [{ type: String }],
    subjects: [{ type: String }],
    verificationStatus: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
    },
    totalClasses: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes for search and filtering optimization
tutorProfileSchema.index({ verificationStatus: 1 });
tutorProfileSchema.index({ hourlyRate: 1 });
tutorProfileSchema.index({ subjects: 1 });
tutorProfileSchema.index({ languages: 1 });
tutorProfileSchema.index({ rating: -1 });

const availabilitySlotSchema = new Schema<IAvailabilitySlot>({
    tutorId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference User ID for consistency
        required: true
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isBooked: { type: Boolean, default: false }
}, { timestamps: true });

// Indexes for availability queries
availabilitySlotSchema.index({ tutorId: 1, startTime: 1 });
availabilitySlotSchema.index({ isBooked: 1, startTime: 1 });

export const TutorProfile = mongoose.models?.TutorProfile || model<ITutorProfile>('TutorProfile', tutorProfileSchema);
export const AvailabilitySlot = mongoose.models?.AvailabilitySlot || model<IAvailabilitySlot>('AvailabilitySlot', availabilitySlotSchema);
