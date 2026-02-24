"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetToken = exports.RefreshToken = exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
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
            delete ret.passwordHash;
            delete ret.__v;
            return ret;
        }
    }
});
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
exports.User = mongoose_1.default.models?.User || (0, mongoose_1.model)('User', userSchema);
exports.RefreshToken = mongoose_1.default.models?.RefreshToken || (0, mongoose_1.model)('RefreshToken', refreshTokenSchema);
exports.PasswordResetToken = mongoose_1.default.models?.PasswordResetToken || (0, mongoose_1.model)('PasswordResetToken', passwordResetTokenSchema);
//# sourceMappingURL=user.model.js.map