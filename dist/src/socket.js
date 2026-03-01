"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = exports.io = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const chat_model_1 = require("./modules/chat/chat.model");
const chat_service_1 = require("./modules/chat/chat.service");
const jwt_1 = require("./config/jwt");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const initSocket = (httpServer) => {
    exports.io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST']
        }
    });
    chat_service_1.ChatService.setSocketIO(exports.io);
    exports.io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                return next(new Error('Authentication error: Token required'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, jwt_1.jwtConfig.accessSecret);
            socket.data.user = decoded;
            next();
        }
        catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });
    exports.io.on('connection', (socket) => {
        console.log(`User connected: ${socket.data.user.userId}`);
        const userId = socket.data.user.userId;
        socket.join(userId);
        console.log(`User ${userId} joined room ${userId}`);
        socket.on('join_room', async (data) => {
            try {
                const { chatId } = data;
                if (!chatId)
                    return;
                const chat = await chat_model_1.ChatRoom.findById(chatId);
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
                socket.join(chatId);
                console.log(`User ${userId} joined room ${chatId}`);
                socket.emit('joined_room', { chatId });
            }
            catch (error) {
                console.error('Join room error:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });
        socket.on('join_tutor_availability', (data) => {
            try {
                const tutorId = data?.tutorId;
                if (!tutorId) {
                    return;
                }
                const room = `availability:${tutorId}`;
                socket.join(room);
                socket.emit('joined_tutor_availability', { tutorId });
            }
            catch (error) {
                console.error('Join tutor availability room error:', error);
            }
        });
        socket.on('send_message', async (data) => {
            try {
                const { chatId, content, attachments } = data;
                if (!chatId || !content)
                    return;
                try {
                    const message = await chat_service_1.ChatService.sendMessage(chatId, userId, { content, attachments });
                    socket.emit('message_sent', { success: true, messageId: message._id });
                }
                catch (serviceError) {
                    socket.emit('error', { message: serviceError.message });
                }
            }
            catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        socket.on('mark_read', async (data) => {
            try {
                const { chatId } = data;
                if (!chatId)
                    return;
                await chat_service_1.ChatService.markAsRead(chatId, userId);
                socket.to(chatId).emit('messages_read', { byUser: userId, chatId });
            }
            catch (error) {
                console.error('Mark read error:', error);
            }
        });
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${userId}`);
        });
    });
    return exports.io;
};
exports.initSocket = initSocket;
//# sourceMappingURL=socket.js.map