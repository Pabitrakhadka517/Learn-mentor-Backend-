import { Request, Response } from 'express';
import { StudyService } from './study.service';

export class StudyController {
    static async getResources(req: Request, res: Response) {
        try {
            const { category } = req.query;
            const resources = await StudyService.getPublicResources(category as string);
            res.status(200).json({ success: true, resources });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getMyResources(req: any, res: Response) {
        try {
            const tutorId = req.user.userId;
            const resources = await StudyService.getTutorResources(tutorId);
            res.status(200).json({ success: true, resources });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async upload(req: any, res: Response) {
        try {
            const tutorId = req.user.userId;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const resource = await StudyService.uploadResource(tutorId, req.body, file);
            res.status(201).json({ success: true, resource, message: 'Resource uploaded successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async delete(req: any, res: Response) {
        try {
            const { id } = req.params;
            const tutorId = req.user.userId;
            await StudyService.deleteResource(id, tutorId);
            res.status(200).json({ success: true, message: 'Resource deleted' });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
