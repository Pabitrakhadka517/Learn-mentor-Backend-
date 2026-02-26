import { Request, Response } from 'express';
import { ChatService } from './chat.service';
import cloudinary from '../../config/cloudinary';

export class ChatController {

    /**
     * GET /api/chats
     * List all active chats for the logged-in user
     */
    static async getChats(req: Request, res: Response) {
        try {
            const { userId, role } = (req as any).user;
            const chats = await ChatService.getUserChats(userId, role);
            res.json({ success: true, chats });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/chats
     * Create or retrieve an existing chat with a user
     */
    static async createChat(req: Request, res: Response) {
        try {
            const { userId, role } = (req as any).user;
            const { targetId } = req.body; // The ID of the person to chat with

            if (!targetId) {
                return res.status(400).json({ success: false, message: 'Target User ID required' });
            }

            let chat;
            if (role === 'STUDENT') {
                chat = await ChatService.getOrCreateChat(userId, targetId);
            } else {
                chat = await ChatService.getOrCreateChat(targetId, userId);
            }

            res.json({ success: true, chat });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * GET /api/chats/:id/messages
     * Get paginated messages for a chat room
     */
    static async getMessages(req: Request, res: Response) {
        try {
            const { id: chatId } = req.params;
            const { userId } = (req as any).user;
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

            const result = await ChatService.getChatMessages(chatId, userId, page, limit);
            res.json({ success: true, ...result });
        } catch (error: any) {
            res.status(403).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/chats/:id/messages
     * Send a message to a chat room with optional file attachment
     */
    static async sendMessage(req: Request, res: Response) {
        try {
            const { id: chatId } = req.params;
            const { userId } = (req as any).user;
            const { content } = req.body;
            const file = req.file;

            if (!content && !file) {
                return res.status(400).json({ success: false, message: 'Message content or file required' });
            }

            let messageData: any = {
                content: content || '',
                messageType: 'text'
            };

            // Handle file upload to Cloudinary if present
            if (file) {
                try {
                    const isImage = file.mimetype.startsWith('image/');
                    const resourceType = isImage ? 'image' : 'raw';
                    
                    const result = await new Promise<any>((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            {
                                folder: 'learnmentor/chats',
                                resource_type: resourceType as any,
                                public_id: `${Date.now()}-${file.originalname.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );
                        uploadStream.end(file.buffer);
                    });

                    messageData.messageType = isImage ? 'image' : 'file';
                    messageData.fileUrl = result.secure_url;
                    messageData.fileName = file.originalname;
                } catch (uploadError: any) {
                    console.error('Chat File Upload Error:', uploadError);
                    return res.status(500).json({ success: false, message: `File upload failed: ${uploadError.message}` });
                }
            }

            const message = await ChatService.sendMessage(chatId, userId, messageData);
            res.status(201).json({ success: true, message });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * POST /api/chats/:id/read
     * Mark all messages in a chat as read
     */
    static async markRead(req: Request, res: Response) {
        try {
            const { id: chatId } = req.params;
            const { userId } = (req as any).user;

            const count = await ChatService.markAsRead(chatId, userId);
            res.json({ success: true, markedCount: count });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * PATCH /api/chats/messages/:messageId
     * Edit a specific message
     */
    static async editMessage(req: Request, res: Response) {
        try {
            const { messageId } = req.params;
            const { userId } = (req as any).user;
            const { content } = req.body;

            if (!content) {
                return res.status(400).json({ success: false, message: 'New content required' });
            }

            const message = await ChatService.editMessage(messageId, userId, content);
            res.json({ success: true, message });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * DELETE /api/chats/messages/:messageId
     * Delete a specific message
     */
    static async deleteMessage(req: Request, res: Response) {
        try {
            const { messageId } = req.params;
            const { userId } = (req as any).user;

            const message = await ChatService.deleteMessage(messageId, userId);
            res.json({ success: true, message });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    /**
     * DELETE /api/chats/:id
     * Delete an entire conversation (Deactivate)
     */
    static async deleteChat(req: Request, res: Response) {
        try {
            const { id: chatId } = req.params;
            const { userId } = (req as any).user;

            await ChatService.deleteChat(chatId, userId);
            res.json({ success: true, message: 'Chat deleted (deactivated)' });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
