"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetToken = exports.RefreshToken = exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
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
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.passwordHash;
            delete ret.__v;
            return ret;
        }
    }
});
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
const refreshTokenSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 });
const passwordResetTokenSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false }
}, { timestamps: true });
passwordResetTokenSchema.index({ userId: 1 });
passwordResetTokenSchema.index({ tokenHash: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 });
exports.User = (0, mongoose_1.model)('User', userSchema);
exports.RefreshToken = (0, mongoose_1.model)('RefreshToken', refreshTokenSchema);
exports.PasswordResetToken = (0, mongoose_1.model)('PasswordResetToken', passwordResetTokenSchema);
//# sourceMappingURL=user.model.js.map