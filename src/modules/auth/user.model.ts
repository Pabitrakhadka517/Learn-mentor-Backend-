import mongoose, { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN';

export interface IUser extends Document {
    _id: Types.ObjectId;
    fullName?: string;
    email: string;
    phone?: string;
    passwordHash: string;
    role: UserRole;
    isVerified: boolean;
    isActive: boolean;
    profileImage?: string;
    speciality?: string;
    address?: string;
    location?: {
        lat: number;
        lng: number;
        city?: string;
        country?: string;
    };
    balance: number;
    // Theme preferences
    theme: 'light' | 'dark' | 'system';
    createdAt: Date;
    updatedAt: Date;
}

export interface IRefreshToken extends Document {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface IPasswordResetToken extends Document {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
}

const userSchema = new Schema<IUser>({
    fullName: { type: String },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: { type: String },
    passwordHash: { type: String, required: true },
    role: {
        type: String,
        enum: ['STUDENT', 'TUTOR', 'ADMIN'],
        default: 'STUDENT'
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    profileImage: { type: String },
    speciality: { type: String },
    address: { type: String },
    location: {
        lat: Number,
        lng: Number,
        city: String,
        country: String
    },
    balance: {
        type: Number,
        default: 0
    },
    theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete (ret as any).passwordHash;
            delete (ret as any).__v;
            return ret;
        }
    }
});

// Index for faster queries
userSchema.index({ role: 1 });

const refreshTokenSchema = new Schema<IRefreshToken>({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Index for cleanup and queries
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 });

const passwordResetTokenSchema = new Schema<IPasswordResetToken>({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false }
}, { timestamps: true });

// Index for queries
passwordResetTokenSchema.index({ userId: 1 });
passwordResetTokenSchema.index({ tokenHash: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 });

export const User = mongoose.models?.User || model<IUser>('User', userSchema);
export const RefreshToken = mongoose.models?.RefreshToken || model<IRefreshToken>('RefreshToken', refreshTokenSchema);
export const PasswordResetToken = mongoose.models?.PasswordResetToken || model<IPasswordResetToken>('PasswordResetToken', passwordResetTokenSchema);