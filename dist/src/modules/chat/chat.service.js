"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const chat_model_1 = require("./chat.model");
const booking_model_1 = require("../booking/booking.model");
const mongoose_1 = require("mongoose");
let ioInstance;
class ChatService {
    static setSocketIO(io) {
        ioInstance = io;
    }
    static async getUserChats(userId, role) {
        const query = role === 'STUDENT' ? { student: userId } : { tutor: userId };
        const chats = await chat_model_1.ChatRoom.find({ ...query, isActive: true })
            .populate('student', 'fullName profileImage')
            .populate('tutor', 'fullName profileImage')
            .sort({ updatedAt: -1 })
            .lean();
        return chats.map(chat => ({
            ...chat,
            participants: {
                student: chat.student,
                tutor: chat.tutor
            },
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt
        }));
    }
    static async getChatMessages(chatId, userId, page = 1, limit = 20) {
        const chat = await chat_model_1.ChatRoom.findOne({
            _id: chatId,
            $or: [{ student: userId }, { tutor: userId }]
        });
        if (!chat) {
            throw new Error('Chat room not found or access denied');
        }
        const messages = await chat_model_1.Message.find({ chatRoom: chatId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('sender', 'fullName profileImage')
            .lean();
        const total = await chat_model_1.Message.countDocuments({ chatRoom: chatId });
        return {
            messages: messages.reverse(),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
    static async getOrCreateChat(studentId, tutorId) {
        const paidBookingExists = await booking_model_1.Booking.findOne({
            student: new mongoose_1.Types.ObjectId(studentId),
            tutor: new mongoose_1.Types.ObjectId(tutorId),
            $or: [
                { status: { $in: ['PAID', 'COMPLETED'] } },
                { paymentStatus: 'DONE' }
            ]
        });
        if (!paidBookingExists) {
            throw new Error('You must have a paid booking with this tutor to start chatting.');
        }
        let chat = await chat_model_1.ChatRoom.findOne({
            student: new mongoose_1.Types.ObjectId(studentId),
            tutor: new mongoose_1.Types.ObjectId(tutorId),
            isActive: true
        });
        if (!chat) {
            chat = await chat_model_1.ChatRoom.create({
                student: new mongoose_1.Types.ObjectId(studentId),
                tutor: new mongoose_1.Types.ObjectId(tutorId),
                isActive: true
            });
        }
        return chat;
    }
    static async sendMessage(chatId, senderId, content, attachments = []) {
        const chat = await chat_model_1.ChatRoom.findOne({
            _id: chatId,
            $or: [{ student: senderId }, { tutor: senderId }],
            isActive: true
        });
        if (!chat) {
            throw new Error('Chat room not active or access denied');
        }
        const message = await chat_model_1.Message.create({
            chatRoom: chatId,
            sender: senderId,
            message: content,
            attachments,
            isRead: false
        });
        chat.lastMessage = content;
        chat.lastMessageAt = new Date();
        await chat.save();
        if (ioInstance) {
            ioInstance.to(chatId).emit('receive_message', await message.populate('sender', 'fullName profileImage'));
        }
        return message;
    }
    static async markAsRead(chatId, userId) {
        const result = await chat_model_1.Message.updateMany({ chatRoom: chatId, sender: { $ne: userId }, isRead: false }, { $set: { isRead: true } });
        return result.modifiedCount;
    }
    static async createChatForBooking(bookingId) {
        const booking = await booking_model_1.Booking.findById(bookingId).populate('student tutor');
        if (!booking)
            throw new Error('Booking not found');
        let chat = await chat_model_1.ChatRoom.findOne({ booking: bookingId });
        if (!chat) {
            chat = await chat_model_1.ChatRoom.findOne({
                student: booking.student._id,
                tutor: booking.tutor._id,
                booking: { $exists: false }
            });
            if (chat) {
                chat.booking = booking._id;
                chat.isActive = true;
                await chat.save();
            }
            else {
                chat = await chat_model_1.ChatRoom.create({
                    booking: booking._id,
                    student: booking.student._id,
                    tutor: booking.tutor._id,
                    isActive: true
                });
            }
        }
        else {
            if (!chat.isActive) {
                chat.isActive = true;
                await chat.save();
            }
        }
        const studentName = booking.student.fullName || 'Student';
        const initialContent = `Booking Confirmed! ${studentName} has paid for the session. You can now start planning your studies.`;
        const msgCount = await chat_model_1.Message.countDocuments({ chatRoom: chat._id });
        if (msgCount === 0) {
            await chat_model_1.Message.create({
                chatRoom: chat._id,
                sender: booking.tutor._id,
                message: initialContent,
                isRead: false
            });
            chat.lastMessage = initialContent;
            chat.lastMessageAt = new Date();
            await chat.save();
        }
        return chat;
    }
    static async deactivateChat(bookingId) {
        await chat_model_1.ChatRoom.findOneAndUpdate({ booking: bookingId }, { isActive: false });
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=chat.service.js.map