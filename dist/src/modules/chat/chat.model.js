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
exports.Message = exports.ChatRoom = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const chatRoomSchema = new mongoose_1.Schema({
    booking: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Booking', required: false, sparse: true },
    student: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    tutor: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    lastMessage: { type: String },
    lastMessageAt: { type: Date }
}, { timestamps: true });
chatRoomSchema.index({ student: 1, isActive: 1 });
chatRoomSchema.index({ tutor: 1, isActive: 1 });
chatRoomSchema.index({ student: 1, tutor: 1, booking: 1 }, { unique: true, sparse: true });
const messageSchema = new mongoose_1.Schema({
    chatRoom: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    message: {
        type: String,
        required: function () {
            return !this.isDeleted && this.messageType === 'text';
        }
    },
    fileUrl: { type: String },
    fileName: { type: String },
    attachments: [{ type: String }],
    isRead: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
messageSchema.index({ chatRoom: 1, createdAt: -1 });
exports.ChatRoom = mongoose_1.default.models?.ChatRoom || (0, mongoose_1.model)('ChatRoom', chatRoomSchema);
exports.Message = mongoose_1.default.models?.Message || (0, mongoose_1.model)('Message', messageSchema);
//# sourceMappingURL=chat.model.js.map