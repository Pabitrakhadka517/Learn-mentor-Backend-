import { Schema, model, Document } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
    email: string;
    passwordHash: string;
    role: UserRole;
    refreshTokenHash?: string;
    location?: {
        lat: number;
        lng: number;
        city?: string;
        country?: string;
    };
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    refreshTokenHash: String,
    location: {
        lat: Number,
        lng: Number,
        city: String,
        country: String
    }
}, { timestamps: true });

export const User = model<IUser>('User', userSchema);