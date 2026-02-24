"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteResourceUseCase = void 0;
const mongoose_1 = require("mongoose");
class DeleteResourceUseCase {
    constructor(repository, cloudinaryService) {
        this.repository = repository;
        this.cloudinaryService = cloudinaryService;
    }
    async execute(resourceId, tutorId) {
        try {
            this.validateResourceId(resourceId);
            this.validateTutorId(tutorId);
            const resource = await this.repository.findById(resourceId);
            if (!resource) {
                throw new Error('Resource not found');
            }
            if (resource.tutorId.toString() !== tutorId) {
                throw new Error('Unauthorized: You can only delete your own resources');
            }
            const publicId = this.extractPublicIdFromUrl(resource.url);
            await this.repository.deleteResource(resourceId, tutorId);
            try {
                await this.cloudinaryService.deleteFile(publicId);
            }
            catch (cloudinaryError) {
                console.warn(`Failed to delete file from Cloudinary: ${publicId}`, cloudinaryError);
            }
        }
        catch (error) {
            throw new Error(`Failed to delete resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async batchDelete(resourceIds, tutorId) {
        const results = {
            deleted: [],
            failed: []
        };
        for (const resourceId of resourceIds) {
            try {
                await this.execute(resourceId, tutorId);
                results.deleted.push(resourceId);
            }
            catch (error) {
                results.failed.push({
                    id: resourceId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return results;
    }
    validateResourceId(resourceId) {
        if (!resourceId || resourceId.trim().length === 0) {
            throw new Error('Resource ID is required');
        }
        try {
            new mongoose_1.Types.ObjectId(resourceId);
        }
        catch {
            throw new Error('Invalid resource ID format');
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
    extractPublicIdFromUrl(cloudinaryUrl) {
        try {
            const urlParts = cloudinaryUrl.split('/');
            const filename = urlParts[urlParts.length - 1];
            const publicId = filename.split('.')[0];
            const uploadIndex = urlParts.findIndex(part => part === 'upload');
            if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                const pathParts = urlParts.slice(uploadIndex + 2, -1);
                return pathParts.length > 0 ? `${pathParts.join('/')}/${publicId}` : publicId;
            }
            return publicId;
        }
        catch (error) {
            console.warn(`Failed to extract public ID from URL: ${cloudinaryUrl}`, error);
            return '';
        }
    }
}
exports.DeleteResourceUseCase = DeleteResourceUseCase;
//# sourceMappingURL=delete-resource.usecase.js.map