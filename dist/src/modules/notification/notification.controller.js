"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
const notification_model_1 = require("./notification.model");
class NotificationController {
    static async getNotifications(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            const notifications = await notification_model_1.Notification.find({ recipient: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('sender', 'fullName profileImage')
                .lean();
            const total = await notification_model_1.Notification.countDocuments({ recipient: userId });
            res.json({
                notifications,
                total,
                page,
                unreadCount: await notification_service_1.NotificationService.getUnreadCount(userId)
            });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async getUnreadCount(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }
            const count = await notification_service_1.NotificationService.getUnreadCount(userId);
            res.json({ count });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async markAsRead(req, res) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }
            const updated = await notification_service_1.NotificationService.markAsRead(id, userId);
            if (!updated) {
                return res.status(404).json({ message: 'Notification not found or access denied' });
            }
            res.json({ success: true, notification: updated });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async markAllAsRead(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }
            await notification_service_1.NotificationService.markAllAsRead(userId);
            res.json({ success: true, message: 'All notifications marked as read' });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async deleteNotification(req, res) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }
            const result = await notification_model_1.Notification.deleteOne({ _id: id, recipient: userId });
            if (result.deletedCount === 0) {
                return res.status(404).json({ message: 'Notification not found' });
            }
            res.json({ success: true, message: 'Notification deleted' });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
exports.NotificationController = NotificationController;
//# sourceMappingURL=notification.controller.js.map