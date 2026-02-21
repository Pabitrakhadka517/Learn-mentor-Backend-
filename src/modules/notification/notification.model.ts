import mongoose, { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
    | 'BOOKING_CREATED'
    | 'BOOKING_UPDATED'
    | 'PAYMENT_SUCCESS'
    | 'NEW_REVIEW'
    | 'ADMIN_MESSAGE';

export interface INotification extends Document {
    recipient: Types.ObjectId;
    sender?: Types.ObjectId;
    type: NotificationType;
    message: string;
    relatedId?: Types.ObjectId;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: [
            'BOOKING_CREATED',
            'BOOKING_UPDATED',
            'PAYMENT_SUCCESS',
            'NEW_REVIEW',
            'ADMIN_MESSAGE'
        ],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedId: {
        type: Schema.Types.ObjectId
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes for fast queries
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.models.Notification || model<INotification>('Notification', notificationSchema);
