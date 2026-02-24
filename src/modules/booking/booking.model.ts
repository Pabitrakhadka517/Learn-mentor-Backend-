import mongoose, { Schema, model, Document, Types } from 'mongoose';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'PAID' | 'COMPLETED' | 'CANCELLED';

export interface IBooking extends Document {
    student: Types.ObjectId;
    tutor: Types.ObjectId;
    status: BookingStatus;
    paymentStatus: 'UNPAID' | 'DONE';
    startTime: Date;
    endTime: Date; // Added for overlap check
    price: number; // For revenue calculation
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'ACCEPTED', 'REJECTED', 'PAID', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    price: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ['UNPAID', 'DONE'],
        default: 'UNPAID'
    }
}, { timestamps: true });

// Indexes for optimized queries
bookingSchema.index({ student: 1, status: 1 }); // For student dashboard queries
bookingSchema.index({ tutor: 1, status: 1 }); // For tutor dashboard queries
bookingSchema.index({ tutor: 1, startTime: 1, endTime: 1 }); // For double-booking prevention
bookingSchema.index({ status: 1 }); // For admin dashboard
bookingSchema.index({ createdAt: -1 }); // For recent bookings sorting


export const Booking = mongoose.models?.Booking || model<IBooking>('Booking', bookingSchema);
