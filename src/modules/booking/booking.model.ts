import mongoose, { Schema, model, Document, Types } from 'mongoose';

export type SessionStatus = 'booked' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'PAID' | 'COMPLETED' | 'CANCELLED';

export interface IBooking extends Document {
    student: Types.ObjectId;
    tutor: Types.ObjectId;
    availabilitySlot?: Types.ObjectId;
    status: string; // Keeping for compatibility or we can migrate
    sessionStatus: SessionStatus;
    paymentStatus: PaymentStatus;
    startTime: Date;
    endTime: Date;
    price: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    availabilitySlot: { type: Schema.Types.ObjectId, ref: 'AvailabilitySlot' },
    status: {
        type: String,
        default: 'PENDING'
    },
    sessionStatus: {
        type: String,
        enum: ['booked', 'confirmed', 'completed', 'cancelled'],
        default: 'booked'
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    price: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    notes: { type: String }
}, { timestamps: true });

// Indexes for optimized queries
bookingSchema.index({ student: 1, status: 1 }); // For student dashboard queries
bookingSchema.index({ tutor: 1, status: 1 }); // For tutor dashboard queries
bookingSchema.index({ tutor: 1, startTime: 1, endTime: 1 }); // For double-booking prevention
bookingSchema.index({ availabilitySlot: 1 });
bookingSchema.index({ status: 1 }); // For admin dashboard
bookingSchema.index({ createdAt: -1 }); // For recent bookings sorting


export const Booking = mongoose.models?.Booking || model<IBooking>('Booking', bookingSchema);
