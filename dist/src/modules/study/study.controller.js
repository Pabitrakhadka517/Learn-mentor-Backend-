"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyController = void 0;
const study_service_1 = require("./study.service");
class StudyController {
    static async getResources(req, res) {
        try {
            const { category } = req.query;
            const resources = await study_service_1.StudyService.getPublicResources(category);
            res.status(200).json({ success: true, resources });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getMyResources(req, res) {
        try {
            const tutorId = req.user.userId;
            const resources = await study_service_1.StudyService.getTutorResources(tutorId);
            res.status(200).json({ success: true, resources });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async upload(req, res) {
        try {
            const tutorId = req.user.userId;
            const file = req.file;
            if (!file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }
            const resource = await study_service_1.StudyService.uploadResource(tutorId, req.body, file);
            res.status(201).json({ success: true, resource, message: 'Resource uploaded successfully' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const tutorId = req.user.userId;
            await study_service_1.StudyService.deleteResource(id, tutorId);
            res.status(200).json({ success: true, message: 'Resource deleted' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.StudyController = StudyController;
//# sourceMappingURL=study.controller.js.map