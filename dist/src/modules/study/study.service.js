"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyService = void 0;
const study_model_1 = require("./study.model");
const cloudinary_1 = __importDefault(require("../../config/cloudinary"));
const mongoose_1 = require("mongoose");
class StudyService {
    static async getPublicResources(category) {
        const query = { isPublic: true };
        if (category && category !== 'All') {
            query.category = category;
        }
        return await study_model_1.StudyResource.find(query).populate('tutor', 'fullName profileImage').sort({ createdAt: -1 });
    }
    static async getTutorResources(tutorId) {
        return await study_model_1.StudyResource.find({ tutor: new mongoose_1.Types.ObjectId(tutorId) }).sort({ createdAt: -1 });
    }
    static async uploadResource(tutorId, data, file) {
        try {
            const resourceType = 'raw';
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.default.uploader.upload_stream({
                    folder: 'learnmentor/study-materials',
                    resource_type: 'auto'
                }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                });
                uploadStream.end(file.buffer);
            });
            const newResource = new study_model_1.StudyResource({
                title: data.title,
                category: data.category,
                type: data.type,
                url: result.secure_url,
                size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                tutor: new mongoose_1.Types.ObjectId(tutorId),
                isPublic: data.isPublic === 'true' || data.isPublic === true
            });
            return await newResource.save();
        }
        catch (error) {
            console.error('Study Upload Error:', error);
            throw new Error(`Resource upload failed: ${error.message}`);
        }
    }
    static async deleteResource(resourceId, tutorId) {
        const resource = await study_model_1.StudyResource.findOne({ _id: resourceId, tutor: tutorId });
        if (!resource) {
            throw new Error('Resource not found or unauthorized');
        }
        return await study_model_1.StudyResource.findByIdAndDelete(resourceId);
    }
}
exports.StudyService = StudyService;
//# sourceMappingURL=study.service.js.map