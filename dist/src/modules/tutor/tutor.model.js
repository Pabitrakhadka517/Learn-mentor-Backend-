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
exports.AvailabilitySlot = exports.TutorProfile = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const tutorProfileSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    bio: { type: String, default: '' },
    experienceYears: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 0 },
    languages: [{ type: String }],
    subjects: [{ type: String }],
    verificationStatus: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
    },
    totalClasses: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
}, { timestamps: true });
tutorProfileSchema.index({ verificationStatus: 1 });
tutorProfileSchema.index({ hourlyRate: 1 });
tutorProfileSchema.index({ subjects: 1 });
tutorProfileSchema.index({ languages: 1 });
tutorProfileSchema.index({ rating: -1 });
const availabilitySlotSchema = new mongoose_1.Schema({
    tutorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isBooked: { type: Boolean, default: false }
}, { timestamps: true });
availabilitySlotSchema.index({ tutorId: 1, startTime: 1 });
availabilitySlotSchema.index({ isBooked: 1, startTime: 1 });
availabilitySlotSchema.index({ tutorId: 1, startTime: 1, endTime: 1 }, { unique: true });
exports.TutorProfile = mongoose_1.default.models?.TutorProfile || (0, mongoose_1.model)('TutorProfile', tutorProfileSchema);
exports.AvailabilitySlot = mongoose_1.default.models?.AvailabilitySlot || (0, mongoose_1.model)('AvailabilitySlot', availabilitySlotSchema);
//# sourceMappingURL=tutor.model.js.map