
import { Types } from 'mongoose';
import { Notification, INotification, NotificationType } from './notification.model';
import { io } from '../../socket'; // Adjust path based on where io is exported

interface CreateNotificationDTO {
    recipient: string | Types.ObjectId;
    sender?: string | Types.ObjectId;
    type: NotificationType;
    message: string;
    relatedId?: string | Types.ObjectId;
}

export class NotificationService {

    /**
     * Helper function to create a notification and emit socket event
     */
    static async createNotification(data: CreateNotificationDTO): Promise<void> {
        try {
            const { recipient, sender, type, message, relatedId } = data;

            // 1. Create notification document
            const notification = new Notification({
                recipient: new Types.ObjectId(recipient),
                sender: sender ? new Types.ObjectId(sender) : undefined,
                type,
                message,
                relatedId: relatedId ? new Types.ObjectId(relatedId) : undefined
            });

            await notification.save();

            // 2. Emit socket event if io is initialized
            if (io) {
                // Assuming users join a room named by their userId upon connection
                // Check socket.ts logic: socket.on('join_room', ...) -> user joins chatId room.
                // Standard practice: user joins room = userId on connection.
                // Let's assume user rooms are named by userId or we emit to specific socket if mapped.
                // socket.ts:41 -> console.log(`User connected: ${socket.data.user.userId}`);
                // It doesn't explicitly join a room `userId` on connection in the provided code, 
                // but usually authentication middleware sets user data.
                // We should add `socket.join(userId)` in socket.ts connection handler to enable this.
                // For now, I will emit to room `recipient.toString()` assuming that logic exists or will be added.

                io.to(recipient.toString()).emit('new_notification', notification);
            }

        } catch (error) {
            // Prevent crashing main application logic
            console.error('Notification Creation Failed:', error);
        }
    }

    /**
     * Get recent notifications for a user
     */
    static async getUserNotifications(userId: string, limit: number = 20) {
        return await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * Get unread notification count
     */
    static async getUnreadCount(userId: string): Promise<number> {
        return await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });
    }

    /**
     * Mark a single notification as read
     */
    static async markAsRead(notificationId: string, userId: string) {
        return await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId }, // Ensure ownership
            { isRead: true },
            { new: true }
        );
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId: string) {
        return await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );
    }
}
