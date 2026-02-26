import { ChatRoom, Message, IChatRoom, IMessage } from './chat.model';
import { Booking, BookingStatus } from '../booking/booking.model';
import { Types } from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | undefined;

export class ChatService {
    static setSocketIO(io: SocketIOServer) {
        ioInstance = io;
    }
    /**
     * Get all active chats for a user
     */
    static async getUserChats(userId: string, role: string) {
        const query = role === 'STUDENT' ? { student: userId } : { tutor: userId };

        // Find active chat rooms
        const chats = await ChatRoom.find({ ...query, isActive: true })
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

    /**
     * Get paginated messages for a chat room
     */
    static async getChatMessages(chatId: string, userId: string, page = 1, limit = 20) {
        // Verify user access
        const chat = await ChatRoom.findOne({
            _id: chatId,
            $or: [{ student: userId }, { tutor: userId }]
        });

        if (!chat) {
            throw new Error('Chat room not found or access denied');
        }

        const messages = await Message.find({ chatRoom: chatId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('sender', 'fullName profileImage')
            .lean();

        const total = await Message.countDocuments({ chatRoom: chatId });

        return {
            messages: messages.reverse(), // Return in chronological order for frontend
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Send a message in a chat room
     */
    /**
     * Get or create a chat room between two users (Inquiry Mode)
     */
    static async getOrCreateChat(studentId: string, tutorId: string) {
        // Enforce: Must have a paid booking together to chat
        // We check for EITHER paymentStatus: 'DONE' OR status: 'PAID'/'COMPLETED'
        const paidBookingExists = await Booking.findOne({
            student: new Types.ObjectId(studentId),
            tutor: new Types.ObjectId(tutorId),
            $or: [
                { status: { $in: ['PAID', 'COMPLETED'] } },
                { paymentStatus: 'DONE' }
            ]
        });

        if (!paidBookingExists) {
            throw new Error('You must have a paid booking with this tutor to start chatting.');
        }

        // Check for existing non-booking chat or booking-linked chat
        let chat = await ChatRoom.findOne({
            student: new Types.ObjectId(studentId),
            tutor: new Types.ObjectId(tutorId),
            isActive: true
        });

        if (!chat) {
            chat = await ChatRoom.create({
                student: new Types.ObjectId(studentId),
                tutor: new Types.ObjectId(tutorId),
                isActive: true
            });
        }

        return chat;
    }

    /**
     * Send a message in a chat room
     */
    static async sendMessage(
        chatId: string,
        senderId: string,
        data: {
            content?: string;
            messageType?: 'text' | 'image' | 'file';
            fileUrl?: string;
            fileName?: string;
            attachments?: string[];
        }
    ) {
        // 1. Verify User Access & Chat Status
        const chat = await ChatRoom.findOne({
            _id: chatId,
            $or: [{ student: senderId }, { tutor: senderId }],
            isActive: true
        });

        if (!chat) {
            throw new Error('Chat room not active or access denied');
        }

        // 2. Identify Receiver
        const receiverId = chat.student.toString() === senderId.toString() ? chat.tutor : chat.student;

        // 3. Create Message
        const message = await Message.create({
            chatRoom: chatId,
            sender: senderId,
            receiver: receiverId,
            messageType: data.messageType || 'text',
            message: data.content || '',
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            attachments: data.attachments || [],
            isRead: false
        });

        // 4. Update Chat Room (Last Message)
        chat.lastMessage = data.messageType === 'text' ? data.content : `Shared a ${data.messageType}`;
        chat.lastMessageAt = new Date();
        await chat.save();

        // 5. Emit Socket Event (Real-time)
        const populatedMessage = await message.populate('sender', 'fullName profileImage');
        if (ioInstance) {
            ioInstance.to(chatId).emit('receive_message', populatedMessage);
        }

        return populatedMessage;
    }

    /**
     * Mark messages as read
     */
    static async markAsRead(chatId: string, userId: string) {
        // Update all messages in this chat where user is recipient
        // Recipient is implicitly "not sender"
        // So we update messages where sender != userId
        const result = await Message.updateMany(
            { chatRoom: chatId, sender: { $ne: userId }, isRead: false },
            { $set: { isRead: true } }
        );

        return result.modifiedCount;
    }

    /**
     * Edit an existing message
     */
    static async editMessage(messageId: string, senderId: string, newContent: string) {
        const message = await Message.findOne({ _id: messageId, sender: senderId, isDeleted: false });
        if (!message) throw new Error('Message not found or you do not have permission.');

        if (message.messageType !== 'text') throw new Error('Only text messages can be edited.');

        message.message = newContent;
        message.isEdited = true;
        await message.save();

        // 4. Update Chat Room if it was the last message
        const chat = await ChatRoom.findById(message.chatRoom);
        if (chat && chat.lastMessageAt?.getTime() === message.createdAt.getTime()) {
            chat.lastMessage = newContent;
            await chat.save();
        }

        if (ioInstance) {
            ioInstance.to(message.chatRoom.toString()).emit('message_edited', {
                messageId: message._id,
                chatRoom: message.chatRoom,
                newContent,
                updatedAt: message.updatedAt
            });
        }

        return await message.populate('sender', 'fullName profileImage');
    }

    /**
     * Delete a message (Soft Delete)
     */
    static async deleteMessage(messageId: string, senderId: string) {
        const message = await Message.findOne({ _id: messageId, sender: senderId, isDeleted: false });
        if (!message) throw new Error('Message not found or permission denied.');

        message.isDeleted = true;
        message.message = 'This message was deleted';
        message.fileUrl = undefined;
        message.fileName = undefined;
        await message.save();

        // Update last message in chat if needed
        const chat = await ChatRoom.findById(message.chatRoom);
        if (chat && chat.lastMessageAt?.getTime() === message.createdAt.getTime()) {
            chat.lastMessage = 'This message was deleted';
            await chat.save();
        }

        if (ioInstance) {
            ioInstance.to(message.chatRoom.toString()).emit('message_deleted', {
                messageId: message._id,
                chatRoom: message.chatRoom
            });
        }

        return await message.populate('sender', 'fullName profileImage');
    }

    /**
     * Automatically create a chat room when booking is accepted/paid
     */
    static async createChatForBooking(bookingId: string) {
        const booking = await Booking.findById(bookingId).populate('student tutor');
        if (!booking) throw new Error('Booking not found');

        // Check if chat already exists for this booking
        let chat = await ChatRoom.findOne({ booking: bookingId });

        if (!chat) {
            // Also check if there's an existing inquiry chat between the same pair
            // to avoid duplicate rooms and keep history if preferred
            chat = await ChatRoom.findOne({
                student: booking.student._id,
                tutor: booking.tutor._id,
                booking: { $exists: false }
            });

            if (chat) {
                // Link it to this booking if it was an inquiry chat
                chat.booking = booking._id as any;
                chat.isActive = true;
                await chat.save();
            } else {
                // Create new active chat room
                chat = await ChatRoom.create({
                    booking: booking._id,
                    student: booking.student._id,
                    tutor: booking.tutor._id,
                    isActive: true
                });
            }
        } else {
            if (!chat.isActive) {
                chat.isActive = true;
                await chat.save();
            }
        }

        // Add an initial "System Message" to make the chat visible and welcoming
        const studentName = (booking.student as any).fullName || 'Student';
        const initialContent = `Booking Confirmed! ${studentName} has paid for the session. You can now start planning your studies.`;

        // Only add if there are no messages yet
        const msgCount = await Message.countDocuments({ chatRoom: chat._id });
        if (msgCount === 0) {
            await Message.create({
                chatRoom: chat._id,
                sender: booking.tutor._id,
                receiver: booking.student._id,
                messageType: 'text',
                message: initialContent,
                isRead: false
            });

            chat.lastMessage = initialContent;
            chat.lastMessageAt = new Date();
            await chat.save();
        }

        return chat;
    }

    /**
     * Deactivate a specific chat manually
     */
    static async deleteChat(chatId: string, userId: string) {
        const chat = await ChatRoom.findOne({
            _id: chatId,
            $or: [{ student: userId }, { tutor: userId }]
        });

        if (!chat) throw new Error('Chat not found or access denied');

        chat.isActive = false;
        await chat.save();
        return chat;
    }

    /**
     * Deactivate chat when booking is cancelled/completed
     */
    static async deactivateChat(bookingId: string) {
        await ChatRoom.findOneAndUpdate(
            { booking: bookingId },
            { isActive: false }
        );
    }
}
