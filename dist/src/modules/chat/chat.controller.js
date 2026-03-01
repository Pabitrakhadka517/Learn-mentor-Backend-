"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const chat_service_1 = require("./chat.service");
const cloudinary_1 = __importDefault(require("../../config/cloudinary"));
class ChatController {
    static async getChats(req, res) {
        try {
            const { userId, role } = req.user;
            const chats = await chat_service_1.ChatService.getUserChats(userId, role);
            res.json({ success: true, chats });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async createChat(req, res) {
        try {
            const { userId, role } = req.user;
            const { targetId } = req.body;
            if (!targetId) {
                return res.status(400).json({ success: false, message: 'Target User ID required' });
            }
            let chat;
            if (role === 'STUDENT') {
                chat = await chat_service_1.ChatService.getOrCreateChat(userId, targetId);
            }
            else {
                chat = await chat_service_1.ChatService.getOrCreateChat(targetId, userId);
            }
            res.json({ success: true, chat });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getMessages(req, res) {
        try {
            const { id: chatId } = req.params;
            const { userId } = req.user;
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const result = await chat_service_1.ChatService.getChatMessages(chatId, userId, page, limit);
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(403).json({ success: false, message: error.message });
        }
    }
    static async sendMessage(req, res) {
        try {
            const { id: chatId } = req.params;
            const { userId } = req.user;
            const { content } = req.body;
            const file = req.file;
            if (!content && !file) {
                return res.status(400).json({ success: false, message: 'Message content or file required' });
            }
            let messageData = {
                content: content || '',
                messageType: 'text'
            };
            if (file) {
                try {
                    const isImage = file.mimetype.startsWith('image/');
                    const resourceType = isImage ? 'image' : 'raw';
                    const result = await new Promise((resolve, reject) => {
                        const uploadStream = cloudinary_1.default.uploader.upload_stream({
                            folder: 'learnmentor/chats',
                            resource_type: resourceType,
                            public_id: `${Date.now()}-${file.originalname.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
                        }, (error, result) => {
                            if (error)
                                reject(error);
                            else
                                resolve(result);
                        });
                        uploadStream.end(file.buffer);
                    });
                    messageData.messageType = isImage ? 'image' : 'file';
                    messageData.fileUrl = result.secure_url;
                    messageData.fileName = file.originalname;
                }
                catch (uploadError) {
                    console.error('Chat File Upload Error:', uploadError);
                    return res.status(500).json({ success: false, message: `File upload failed: ${uploadError.message}` });
                }
            }
            const message = await chat_service_1.ChatService.sendMessage(chatId, userId, messageData);
            res.status(201).json({ success: true, message });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async markRead(req, res) {
        try {
            const { id: chatId } = req.params;
            const { userId } = req.user;
            const count = await chat_service_1.ChatService.markAsRead(chatId, userId);
            res.json({ success: true, markedCount: count });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async editMessage(req, res) {
        try {
            const { messageId } = req.params;
            const { userId } = req.user;
            const { content } = req.body;
            if (!content) {
                return res.status(400).json({ success: false, message: 'New content required' });
            }
            const message = await chat_service_1.ChatService.editMessage(messageId, userId, content);
            res.json({ success: true, message });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async deleteMessage(req, res) {
        try {
            const { messageId } = req.params;
            const { userId } = req.user;
            const message = await chat_service_1.ChatService.deleteMessage(messageId, userId);
            res.json({ success: true, message });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async deleteChat(req, res) {
        try {
            const { id: chatId } = req.params;
            const { userId } = req.user;
            await chat_service_1.ChatService.deleteChat(chatId, userId);
            res.json({ success: true, message: 'Chat deleted (deactivated)' });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.ChatController = ChatController;
//# sourceMappingURL=chat.controller.js.map