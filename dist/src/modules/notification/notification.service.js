"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const mongoose_1 = require("mongoose");
const notification_model_1 = require("./notification.model");
const socket_1 = require("../../socket");
class NotificationService {
    static async createNotification(data) {
        try {
            const { recipient, sender, type, message, relatedId } = data;
            const notification = new notification_model_1.Notification({
                recipient: new mongoose_1.Types.ObjectId(recipient),
                sender: sender ? new mongoose_1.Types.ObjectId(sender) : undefined,
                type,
                message,
                relatedId: relatedId ? new mongoose_1.Types.ObjectId(relatedId) : undefined
            });
            await notification.save();
            if (socket_1.io) {
                socket_1.io.to(recipient.toString()).emit('new_notification', notification);
            }
        }
        catch (error) {
            console.error('Notification Creation Failed:', error);
        }
    }
    static async getUserNotifications(userId, limit = 20) {
        return await notification_model_1.Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }
    static async getUnreadCount(userId) {
        return await notification_model_1.Notification.countDocuments({
            recipient: userId,
            isRead: false
        });
    }
    static async markAsRead(notificationId, userId) {
        return await notification_model_1.Notification.findOneAndUpdate({ _id: notificationId, recipient: userId }, { isRead: true }, { new: true });
    }
    static async markAllAsRead(userId) {
        return await notification_model_1.Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map