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
exports.StudyResourceModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const studyresource_entity_1 = require("../../domain/entities/studyresource.entity");
const studyResourceSchema = new mongoose_1.Schema({
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
        enum: Object.values(studyresource_entity_1.ResourceType),
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
        type: mongoose_1.Schema.Types.ObjectId,
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
studyResourceSchema.index({ tutorId: 1, createdAt: -1 });
studyResourceSchema.index({ isPublic: 1, category: 1, createdAt: -1 });
studyResourceSchema.index({ isPublic: 1, type: 1, createdAt: -1 });
studyResourceSchema.index({ title: 'text', category: 'text' });
studyResourceSchema.virtual('tutor', {
    ref: 'User',
    localField: 'tutorId',
    foreignField: '_id',
    justOne: true
});
studyResourceSchema.set('toJSON', { virtuals: true });
studyResourceSchema.set('toObject', { virtuals: true });
exports.StudyResourceModel = mongoose_1.default.model('StudyResource', studyResourceSchema);
//# sourceMappingURL=studyresource.model.js.map