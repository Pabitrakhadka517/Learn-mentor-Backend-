import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
    title: string;
    content: string;
    targetRole: 'ALL' | 'STUDENT' | 'TUTOR';
    type: 'INFO' | 'WARNING' | 'URGENT';
    createdBy: mongoose.Types.ObjectId;
    isActive: boolean;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AnnouncementSchema: Schema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    targetRole: { type: String, enum: ['ALL', 'STUDENT', 'TUTOR'], default: 'ALL' },
    type: { type: String, enum: ['INFO', 'WARNING', 'URGENT'], default: 'INFO' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date }
}, { timestamps: true });

export const Announcement = mongoose.models?.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
