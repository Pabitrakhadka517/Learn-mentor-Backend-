"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'tutor'], default: 'user' },
    refreshTokenHash: String,
    name: String,
    phone: String,
    speciality: String,
    address: String,
    profileImage: String,
    location: {
        lat: Number,
        lng: Number,
        city: String,
        country: String
    }
}, { timestamps: true });
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=user.model.js.map