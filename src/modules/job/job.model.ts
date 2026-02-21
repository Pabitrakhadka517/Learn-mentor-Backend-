import mongoose, { Schema, model, Document, Types } from 'mongoose';

export type JobStatus = 'pending' | 'active' | 'finished' | 'cancelled';
export type PaymentStatus = 'pending' | 'done' | 'failed';

export interface IJob extends Document {
    title: string;
    description: string;
    sender: Types.ObjectId; // Student/Client
    receiver: Types.ObjectId; // Tutor/Freelancer
    amount: number;
    status: JobStatus;
    paymentStatus: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
}

const jobSchema = new Schema<IJob>({
    title: { type: String, required: true },
    description: { type: String },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'active', 'finished', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'done', 'failed'],
        default: 'pending'
    }
}, { timestamps: true });

// Indexes
jobSchema.index({ sender: 1 });
jobSchema.index({ receiver: 1 });

export const Job = mongoose.models.Job || model<IJob>('Job', jobSchema);
