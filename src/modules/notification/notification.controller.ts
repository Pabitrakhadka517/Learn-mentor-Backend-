
import { Request, Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { NotificationService } from './notification.service';
import { Notification } from './notification.model';

export class NotificationController {
    static async getNotifications(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            // Fetch notifications with pagination
            const notifications = await Notification.find({ recipient: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('sender', 'fullName profileImage') // Populate sender basic info
                .lean(); // Use lean for performance

            const total = await Notification.countDocuments({ recipient: userId });

            res.json({
                notifications,
                total,
                page,
                unreadCount: await NotificationService.getUnreadCount(userId) // Add unread count immediately
            });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getUnreadCount(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            const count = await NotificationService.getUnreadCount(userId);
            res.json({ count });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async markAsRead(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            const updated = await NotificationService.markAsRead(id, userId);

            if (!updated) {
                return res.status(404).json({ message: 'Notification not found or access denied' });
            }

            res.json({ success: true, notification: updated });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async markAllAsRead(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            await NotificationService.markAllAsRead(userId);
            res.json({ success: true, message: 'All notifications marked as read' });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    static async deleteNotification(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            // Ensure ownership before deleting
            const result = await Notification.deleteOne({ _id: id, recipient: userId });

            if (result.deletedCount === 0) {
                return res.status(404).json({ message: 'Notification not found' });
            }

            res.json({ success: true, message: 'Notification deleted' });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
