import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { ChatRoom } from './modules/chat/chat.model';
import { ChatService } from './modules/chat/chat.service';
import dotenv from 'dotenv';

dotenv.config();

export let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST']
        }
    });

    ChatService.setSocketIO(io);

    // Authentication Middleware
    io.use(async (socket: Socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication error: Token required'));
            }

            const decoded: any = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback_secret');
            socket.data.user = decoded; // { userId, role, email }
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // Connection Handler
    io.on('connection', (socket: Socket) => {
        console.log(`User connected: ${socket.data.user.userId}`);
        const userId = socket.data.user.userId;

        // Join user-specific room for notifications
        socket.join(userId);
        console.log(`User ${userId} joined room ${userId}`);

        // Join Room Event
        socket.on('join_room', async (data: { chatId: string }) => {
            try {
                const { chatId } = data;
                if (!chatId) return;

                // Verify User Belongs to Chat
                const chat = await ChatRoom.findById(chatId);
                if (!chat) {
                    socket.emit('error', { message: 'Chat room not found' });
                    return;
                }

                const isParticipant = chat.student.toString() === userId || chat.tutor.toString() === userId;

                if (!isParticipant) {
                    socket.emit('error', { message: 'Unauthorized access to chat room' });
                    return;
                }

                if (!chat.isActive) {
                    socket.emit('error', { message: 'Chat is no longer active' });
                    return;
                }

                // Leave previous rooms if any? Or allow multiple? Usually just join.
                socket.join(chatId);
                console.log(`User ${userId} joined room ${chatId}`);
                socket.emit('joined_room', { chatId });

            } catch (error) {
                console.error('Join room error:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // Send Message Event
        socket.on('send_message', async (data: { chatId: string, content: string, attachments?: string[] }) => {
            try {
                const { chatId, content, attachments } = data;

                if (!chatId || !content) return;

                // Use Service to persist message and validate business logic (booking status)
                // Service also emits 'receive_message' to the room
                try {
                    // Note: createMessage emits to room via io instance if available
                    // But socket.to(room) excludes sender. io.to(room) includes everyone.
                    // ChatService uses io.to().
                    const message = await ChatService.sendMessage(chatId, userId, content, attachments);

                    // Acknowledge sender
                    socket.emit('message_sent', { success: true, messageId: message._id });

                } catch (serviceError: any) {
                    socket.emit('error', { message: serviceError.message });
                }

            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Mark Read Event
        socket.on('mark_read', async (data: { chatId: string }) => {
            try {
                const { chatId } = data;
                if (!chatId) return;

                await ChatService.markAsRead(chatId, userId);

                // Notify others in room that messages were read?
                // Usually good UX
                socket.to(chatId).emit('messages_read', { byUser: userId, chatId });

            } catch (error) {
                console.error('Mark read error:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${userId}`);
        });
    });

    return io;
};
