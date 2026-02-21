import { Request, Response } from "express";
import { Announcement } from "./announcement.model";

export class AnnouncementController {
    static async create(req: Request, res: Response) {
        try {
            const { title, content, targetRole, type, expiresAt } = req.body;
            const announcement = await Announcement.create({
                title,
                content,
                targetRole,
                type,
                expiresAt,
                createdBy: (req as any).user.userId
            });
            res.status(201).json({ success: true, announcement });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getAll(req: Request, res: Response) {
        try {
            const { role } = (req as any).user;
            const filter: any = { isActive: true };

            // If not admin, filter by targetRole
            if (role !== 'ADMIN') {
                filter.targetRole = { $in: ['ALL', role] };
            }

            const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
            res.status(200).json({ success: true, announcements });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            await Announcement.findByIdAndDelete(req.params.id);
            res.status(200).json({ success: true, message: "Announcement deleted" });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
