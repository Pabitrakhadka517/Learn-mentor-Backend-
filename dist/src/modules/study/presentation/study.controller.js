"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyController = void 0;
const studyresource_dto_1 = require("../application/dto/studyresource.dto");
class StudyController {
    constructor(getPublicResourcesUseCase, getMyResourcesUseCase, uploadResourceUseCase, deleteResourceUseCase) {
        this.getPublicResourcesUseCase = getPublicResourcesUseCase;
        this.getMyResourcesUseCase = getMyResourcesUseCase;
        this.uploadResourceUseCase = uploadResourceUseCase;
        this.deleteResourceUseCase = deleteResourceUseCase;
    }
    async getPublicResources(req, res) {
        try {
            const { category, type, search } = req.query;
            const filter = {};
            if (category && typeof category === 'string')
                filter.category = category;
            if (type && typeof type === 'string')
                filter.type = type;
            if (search && typeof search === 'string')
                filter.search = search;
            const resources = await this.getPublicResourcesUseCase.execute(filter);
            res.status(200).json({
                success: true,
                message: 'Public resources retrieved successfully',
                data: {
                    resources,
                    count: resources.length
                }
            });
        }
        catch (error) {
            console.error('Error getting public resources:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to retrieve public resources'
            });
        }
    }
    async getMyResources(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { userId, role } = req.user;
            if (role !== 'TUTOR' && role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Only tutors and admins can access this resource'
                });
                return;
            }
            const resources = await this.getMyResourcesUseCase.execute(userId);
            const statistics = await this.getMyResourcesUseCase.getStatistics(userId);
            res.status(200).json({
                success: true,
                message: 'Your resources retrieved successfully',
                data: {
                    resources,
                    statistics,
                    count: resources.length
                }
            });
        }
        catch (error) {
            console.error('Error getting tutor resources:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to retrieve your resources'
            });
        }
    }
    async uploadResource(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { userId, role } = req.user;
            if (role !== 'TUTOR' && role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Only tutors and admins can upload resources'
                });
                return;
            }
            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: 'File is required'
                });
                return;
            }
            const { title, category, isPublic } = req.body;
            if (!title || typeof title !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Title is required and must be a string'
                });
                return;
            }
            const isResourcePublic = isPublic === 'true' || isPublic === true;
            const createResourceDTO = new studyresource_dto_1.CreateStudyResourceDTO(title.trim(), category?.trim() || null, isResourcePublic, req.file);
            const resource = await this.uploadResourceUseCase.execute(userId, createResourceDTO);
            res.status(201).json({
                success: true,
                message: 'Resource uploaded successfully',
                data: {
                    resource
                }
            });
        }
        catch (error) {
            console.error('Error uploading resource:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to upload resource'
            });
        }
    }
    async deleteResource(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { userId, role } = req.user;
            const { id } = req.params;
            if (role !== 'TUTOR' && role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Only tutors and admins can delete resources'
                });
                return;
            }
            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Resource ID is required'
                });
                return;
            }
            await this.deleteResourceUseCase.execute(id, userId);
            res.status(200).json({
                success: true,
                message: 'Resource deleted successfully'
            });
        }
        catch (error) {
            console.error('Error deleting resource:', error);
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    res.status(404).json({
                        success: false,
                        message: error.message
                    });
                    return;
                }
                if (error.message.includes('Unauthorized')) {
                    res.status(403).json({
                        success: false,
                        message: error.message
                    });
                    return;
                }
            }
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to delete resource'
            });
        }
    }
    async batchDeleteResources(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { userId, role } = req.user;
            const { resourceIds } = req.body;
            if (role !== 'TUTOR' && role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Only tutors and admins can delete resources'
                });
                return;
            }
            if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Resource IDs array is required'
                });
                return;
            }
            const results = await this.deleteResourceUseCase.batchDelete(resourceIds, userId);
            res.status(200).json({
                success: true,
                message: 'Batch deletion completed',
                data: {
                    deleted: results.deleted,
                    failed: results.failed,
                    summary: {
                        totalRequested: resourceIds.length,
                        successfulDeletions: results.deleted.length,
                        failedDeletions: results.failed.length
                    }
                }
            });
        }
        catch (error) {
            console.error('Error batch deleting resources:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to batch delete resources'
            });
        }
    }
}
exports.StudyController = StudyController;
//# sourceMappingURL=study.controller.js.map