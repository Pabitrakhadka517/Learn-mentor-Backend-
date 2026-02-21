import mongoose, { Schema, model, Document, Types } from 'mongoose';

export type TransactionStatus = 'pending' | 'done' | 'failed';

export interface ITransaction extends Document {
    job?: Types.ObjectId;
    booking?: Types.ObjectId;
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    amount: number;
    commission: number;
    receiverAmount: number;
    productCode: string;
    transactionUuid: string;
    transactionCode?: string;
    status: TransactionStatus;
    createdAt: Date;
    updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
    job: {
        type: Schema.Types.ObjectId,
        ref: 'Job',
        required: false
    },
    booking: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: false
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    commission: {
        type: Number,
        default: 0
    },
    receiverAmount: {
        type: Number,
        default: 0
    },
    productCode: {
        type: String,
        required: true
    },
    transactionUuid: {
        type: String,
        required: true,
        unique: true
    },
    transactionCode: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'done', 'failed'],
        default: 'pending'
    }
}, { timestamps: true });

// Indexes for faster lookups based on sender/receiver/job
transactionSchema.index({ sender: 1 });
transactionSchema.index({ receiver: 1 });
transactionSchema.index({ job: 1 });

export const Transaction = mongoose.models.Transaction || model<ITransaction>('Transaction', transactionSchema);
