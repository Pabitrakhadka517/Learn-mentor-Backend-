"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyResourceEntity = exports.ResourceType = void 0;
const studyresource_dto_1 = require("../../application/dto/studyresource.dto");
var ResourceType;
(function (ResourceType) {
    ResourceType["PDF"] = "PDF";
    ResourceType["MODULE"] = "MODULE";
    ResourceType["OTHER"] = "OTHER";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
class StudyResourceEntity {
    constructor(title, category, type, url, size, tutorId, isPublic, createdAt = new Date(), updatedAt = new Date(), id) {
        this.title = title;
        this.category = category;
        this.type = type;
        this.url = url;
        this.size = size;
        this.tutorId = tutorId;
        this.isPublic = isPublic;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.id = id;
        this.validateTitle(title);
    }
    validateTitle(title) {
        if (!title || title.trim().length < 2 || title.trim().length > 200) {
            throw new Error('Title must be between 2 and 200 characters');
        }
    }
    static validateFileType(mimeType) {
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
        if (!allowedMimeTypes.includes(mimeType)) {
            return {
                isValid: false,
                error: `File type ${mimeType} is not supported. Allowed types: PDF, DOC, DOCX, TXT, PPT, PPTX, JPG, PNG, GIF`
            };
        }
        return { isValid: true };
    }
    static validateFileSize(sizeInBytes, resourceType) {
        const maxSizeInMB = resourceType === ResourceType.PDF ? 10 : 5;
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        if (sizeInBytes > maxSizeInBytes) {
            return {
                isValid: false,
                error: `File size exceeds ${maxSizeInMB}MB limit for ${resourceType} files`
            };
        }
        return { isValid: true };
    }
    static calculateSize(sizeInBytes) {
        if (sizeInBytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
        return parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    static determineResourceType(mimeType) {
        if (mimeType === 'application/pdf') {
            return ResourceType.PDF;
        }
        else if (mimeType.includes('word') ||
            mimeType.includes('powerpoint') ||
            mimeType === 'text/plain') {
            return ResourceType.MODULE;
        }
        else {
            return ResourceType.OTHER;
        }
    }
    static create(title, category, url, mimeType, sizeInBytes, tutorId, isPublic) {
        const resourceType = this.determineResourceType(mimeType);
        const size = this.calculateSize(sizeInBytes);
        return new StudyResourceEntity(title.trim(), category?.trim() || null, resourceType, url, size, tutorId, isPublic);
    }
    mapToDTO() {
        return new studyresource_dto_1.StudyResourceDTO(this.id?.toString() || '', this.title, this.category, this.type, this.url, this.size, this.tutorId.toString(), this.isPublic, this.createdAt, this.updatedAt);
    }
    update(title, category, isPublic) {
        const updatedTitle = title?.trim() || this.title;
        const updatedCategory = category?.trim() || this.category;
        const updatedIsPublic = isPublic !== undefined ? isPublic : this.isPublic;
        if (title) {
            this.validateTitle(updatedTitle);
        }
        return new StudyResourceEntity(updatedTitle, updatedCategory, this.type, this.url, this.size, this.tutorId, updatedIsPublic, this.createdAt, new Date(), this.id);
    }
}
exports.StudyResourceEntity = StudyResourceEntity;
//# sourceMappingURL=studyresource.entity.js.map