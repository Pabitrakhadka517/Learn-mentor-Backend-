import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IChatRoom extends Document {
    booking?: Types.ObjectId;
    student: Types.ObjectId;
    tutor: Types.ObjectId;
    isActive: boolean;
    lastMessage?: string;
    lastMessageAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMessage extends Document {
    chatRoom: Types.ObjectId;
    sender: Types.ObjectId;
    message: string;
    attachments?: string[];
    isRead: boolean;
    createdAt: Date;
}

const chatRoomSchema = new Schema<IChatRoom>({
    // sparse: true ensures null booking values are excluded from the unique index
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: false, sparse: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tutor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    lastMessage: { type: String },
    lastMessageAt: { type: Date }
}, { timestamps: true });

// Index for getting user's active chats
chatRoomSchema.index({ student: 1, isActive: 1 });
chatRoomSchema.index({ tutor: 1, isActive: 1 });
// One chat room per student+tutor pair (inquiry) or per student+tutor+booking combo.
// sparse: true means docs where booking=null are excluded from index, preventing
// the E11000 dup key error when multiple booking-less chats exist.
chatRoomSchema.index({ student: 1, tutor: 1, booking: 1 }, { unique: true, sparse: true });

const messageSchema = new Schema<IMessage>({
    chatRoom: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    attachments: [{ type: String }], // URLs to stored files
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Index for retrieving chat history
messageSchema.index({ chatRoom: 1, createdAt: -1 });

export const ChatRoom = mongoose.models?.ChatRoom || model<IChatRoom>('ChatRoom', chatRoomSchema);
export const Message = mongoose.models?.Message || model<IMessage>('Message', messageSchema);
