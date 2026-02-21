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
        content: string,
        attachments: string[] = []
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

        // 3. Create Message
        const message = await Message.create({
            chatRoom: chatId,
            sender: senderId,
            message: content,
            attachments,
            isRead: false
        });

        // 4. Update Chat Room (Last Message)
        chat.lastMessage = content;
        chat.lastMessageAt = new Date();
        await chat.save();

        // 5. Emit Socket Event (Real-time)
        if (ioInstance) {
            ioInstance.to(chatId).emit('receive_message', await message.populate('sender', 'fullName profileImage'));
        }

        return message;
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
                sender: booking.tutor._id, // Set tutor or a system ID as sender
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
     * Deactivate chat when booking is cancelled/completed
     */
    static async deactivateChat(bookingId: string) {
        await ChatRoom.findOneAndUpdate(
            { booking: bookingId },
            { isActive: false }
        );
    }
}
