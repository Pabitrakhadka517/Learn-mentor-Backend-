import mongoose, { Schema, Document, Types } from 'mongoose';
import { ResourceType } from '../../domain/entities/studyresource.entity';

export interface IStudyResource extends Document {
  _id: Types.ObjectId;
  title: string;
  category?: string;
  type: ResourceType;
  url: string;
  size: string;
  tutorId: Types.ObjectId;
  isPublic: boolean;
  downloadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const studyResourceSchema = new Schema<IStudyResource>({
  title: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 200,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: Object.values(ResourceType),
    required: true
  },
  url: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  tutorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'studyresources'
});

// Indexes for performance
studyResourceSchema.index({ tutorId: 1, createdAt: -1 });
studyResourceSchema.index({ isPublic: 1, category: 1, createdAt: -1 });
studyResourceSchema.index({ isPublic: 1, type: 1, createdAt: -1 });
studyResourceSchema.index({ title: 'text', category: 'text' }); // Text search

// Virtual for tutor details
studyResourceSchema.virtual('tutor', {
  ref: 'User',
  localField: 'tutorId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
studyResourceSchema.set('toJSON', { virtuals: true });
studyResourceSchema.set('toObject', { virtuals: true });

export const StudyResourceModel = mongoose.model<IStudyResource>('StudyResource', studyResourceSchema);