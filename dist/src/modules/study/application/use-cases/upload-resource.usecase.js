"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadResourceUseCase = void 0;
const studyresource_entity_1 = require("../../domain/entities/studyresource.entity");
const mongoose_1 = require("mongoose");
class UploadResourceUseCase {
    constructor(repository, cloudinaryService) {
        this.repository = repository;
        this.cloudinaryService = cloudinaryService;
    }
    async execute(tutorId, createResourceData) {
        try {
            this.validateTutorId(tutorId);
            this.validateCreateResourceData(createResourceData);
            this.validateFile(createResourceData.file);
            const uploadResult = await this.uploadFile(createResourceData.file);
            const resourceEntity = studyresource_entity_1.StudyResourceEntity.create(createResourceData.title, createResourceData.category, uploadResult.secure_url, createResourceData.file.mimetype, uploadResult.bytes, new mongoose_1.Types.ObjectId(tutorId), createResourceData.isPublic);
            const savedResource = await this.repository.uploadResource(resourceEntity);
            return savedResource;
        }
        catch (error) {
            throw new Error(`Failed to upload resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async uploadFile(file) {
        try {
            return await this.cloudinaryService.uploadFile(file);
        }
        catch (error) {
            throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateTutorId(tutorId) {
        if (!tutorId || tutorId.trim().length === 0) {
            throw new Error('Tutor ID is required');
        }
        try {
            new mongoose_1.Types.ObjectId(tutorId);
        }
        catch {
            throw new Error('Invalid tutor ID format');
        }
    }
    validateCreateResourceData(data) {
        if (!data.title || data.title.trim().length < 2 || data.title.trim().length > 200) {
            throw new Error('Title must be between 2 and 200 characters');
        }
        if (data.category && data.category.trim().length > 100) {
            throw new Error('Category must be less than 100 characters');
        }
        if (typeof data.isPublic !== 'boolean') {
            throw new Error('isPublic must be a boolean value');
        }
    }
    validateFile(file) {
        if (!file) {
            throw new Error('File is required');
        }
        const fileTypeValidation = studyresource_entity_1.StudyResourceEntity.validateFileType(file.mimetype);
        if (!fileTypeValidation.isValid) {
            throw new Error(fileTypeValidation.error);
        }
        const resourceType = studyresource_entity_1.StudyResourceEntity.determineResourceType(file.mimetype);
        const fileSizeValidation = studyresource_entity_1.StudyResourceEntity.validateFileSize(file.size, resourceType);
        if (!fileSizeValidation.isValid) {
            throw new Error(fileSizeValidation.error);
        }
    }
}
exports.UploadResourceUseCase = UploadResourceUseCase;
//# sourceMappingURL=upload-resource.usecase.js.map