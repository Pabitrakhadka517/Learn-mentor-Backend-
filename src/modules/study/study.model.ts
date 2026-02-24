import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IStudyResource extends Document {
    title: string;
    category: string;
    type: 'PDF' | 'MODULE' | 'OTHER';
    url: string;
    size?: string;
    duration?: string;
    tutor: Types.ObjectId;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const studyResourceSchema = new Schema<IStudyResource>({
    title: { type: String, required: true },
    category: { type: String, required: true },
    type: {
        type: String,
        enum: ['PDF', 'MODULE', 'OTHER'],
        required: true
    },
    url: { type: String, required: true },
    size: { type: String },
    duration: { type: String },
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: true }
}, { timestamps: true });

// Index for filtering
studyResourceSchema.index({ category: 1, isPublic: 1 });
studyResourceSchema.index({ tutor: 1 });

export const StudyResource = mongoose.models?.StudyResource || model<IStudyResource>('StudyResource', studyResourceSchema);
