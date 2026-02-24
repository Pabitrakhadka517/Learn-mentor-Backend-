"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyResourceRepository = void 0;
const studyresource_entity_1 = require("../../domain/entities/studyresource.entity");
const studyresource_dto_1 = require("../../application/dto/studyresource.dto");
const studyresource_model_1 = require("../models/studyresource.model");
const mongoose_1 = require("mongoose");
class StudyResourceRepository {
    async getPublicResources(filter) {
        try {
            let query = { isPublic: true };
            let sortOptions = { createdAt: -1 };
            if (filter) {
                if (filter.category) {
                    query.category = new RegExp(filter.category, 'i');
                }
                if (filter.type) {
                    query.type = filter.type;
                }
                if (filter.search) {
                    query.$text = { $search: filter.search };
                }
            }
            const resources = await studyresource_model_1.StudyResourceModel
                .find(query)
                .populate('tutor', 'fullName')
                .sort(sortOptions)
                .lean()
                .exec();
            return resources.map(resource => this.mapToDTO(resource));
        }
        catch (error) {
            throw new Error(`Failed to retrieve public resources: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async getMyResources(tutorId) {
        try {
            const objectId = new mongoose_1.Types.ObjectId(tutorId);
            const resources = await studyresource_model_1.StudyResourceModel
                .find({ tutorId: objectId })
                .sort({ createdAt: -1 })
                .lean()
                .exec();
            return resources.map(resource => this.mapToDTO(resource));
        }
        catch (error) {
            throw new Error(`Failed to retrieve tutor resources: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async uploadResource(resource) {
        try {
            const newResource = new studyresource_model_1.StudyResourceModel({
                title: resource.title,
                category: resource.category,
                type: resource.type,
                url: resource.url,
                size: resource.size,
                tutorId: resource.tutorId,
                isPublic: resource.isPublic
            });
            const saved = await newResource.save();
            return this.mapToDTO(saved.toObject());
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('duplicate key')) {
                throw new Error('A resource with similar details already exists');
            }
            throw new Error(`Failed to save resource: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async deleteResource(resourceId, tutorId) {
        try {
            const resourceObjectId = new mongoose_1.Types.ObjectId(resourceId);
            const tutorObjectId = new mongoose_1.Types.ObjectId(tutorId);
            const result = await studyresource_model_1.StudyResourceModel.deleteOne({
                _id: resourceObjectId,
                tutorId: tutorObjectId
            });
            if (result.deletedCount === 0) {
                throw new Error('Resource not found or you do not have permission to delete it');
            }
        }
        catch (error) {
            throw new Error(`Failed to delete resource: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async findById(resourceId) {
        try {
            const objectId = new mongoose_1.Types.ObjectId(resourceId);
            const resource = await studyresource_model_1.StudyResourceModel.findById(objectId).lean().exec();
            if (!resource) {
                return null;
            }
            return this.mapToEntity(resource);
        }
        catch (error) {
            throw new Error(`Failed to find resource: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async updateResource(resourceId, updateData, tutorId) {
        try {
            const resourceObjectId = new mongoose_1.Types.ObjectId(resourceId);
            const tutorObjectId = new mongoose_1.Types.ObjectId(tutorId);
            const updatedResource = await studyresource_model_1.StudyResourceModel.findOneAndUpdate({ _id: resourceObjectId, tutorId: tutorObjectId }, {
                ...updateData,
                updatedAt: new Date()
            }, { new: true, lean: true }).exec();
            if (!updatedResource) {
                throw new Error('Resource not found or you do not have permission to update it');
            }
            return this.mapToDTO(updatedResource);
        }
        catch (error) {
            throw new Error(`Failed to update resource: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async verifyOwnership(resourceId, tutorId) {
        try {
            const resourceObjectId = new mongoose_1.Types.ObjectId(resourceId);
            const tutorObjectId = new mongoose_1.Types.ObjectId(tutorId);
            const count = await studyresource_model_1.StudyResourceModel.countDocuments({
                _id: resourceObjectId,
                tutorId: tutorObjectId
            });
            return count > 0;
        }
        catch (error) {
            return false;
        }
    }
    async getResourceStatistics(tutorId) {
        try {
            const matchStage = {};
            if (tutorId) {
                matchStage.tutorId = new mongoose_1.Types.ObjectId(tutorId);
            }
            const pipeline = [
                ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
                {
                    $group: {
                        _id: null,
                        totalResources: { $sum: 1 },
                        publicResources: {
                            $sum: { $cond: [{ $eq: ['$isPublic', true] }, 1, 0] }
                        },
                        privateResources: {
                            $sum: { $cond: [{ $eq: ['$isPublic', false] }, 1, 0] }
                        },
                        typeGroups: {
                            $push: '$type'
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalResources: 1,
                        publicResources: 1,
                        privateResources: 1,
                        resourcesByType: {
                            $arrayToObject: {
                                $map: {
                                    input: ['PDF', 'MODULE', 'OTHER'],
                                    as: 'type',
                                    in: {
                                        k: '$$type',
                                        v: {
                                            $size: {
                                                $filter: {
                                                    input: '$typeGroups',
                                                    cond: { $eq: ['$$this', '$$type'] }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ];
            const result = await studyresource_model_1.StudyResourceModel.aggregate(pipeline);
            if (result.length === 0) {
                return {
                    totalResources: 0,
                    publicResources: 0,
                    privateResources: 0,
                    resourcesByType: { PDF: 0, MODULE: 0, OTHER: 0 }
                };
            }
            return result[0];
        }
        catch (error) {
            throw new Error(`Failed to get resource statistics: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    mapToDTO(resource) {
        return new studyresource_dto_1.StudyResourceDTO(resource._id.toString(), resource.title, resource.category || null, resource.type, resource.url, resource.size, resource.tutorId.toString(), resource.isPublic, resource.createdAt, resource.updatedAt, resource.tutor?.fullName, resource.downloadCount || 0);
    }
    mapToEntity(resource) {
        return new studyresource_entity_1.StudyResourceEntity(resource.title, resource.category || null, resource.type, resource.url, resource.size, resource.tutorId, resource.isPublic, resource.createdAt, resource.updatedAt, resource._id);
    }
}
exports.StudyResourceRepository = StudyResourceRepository;
//# sourceMappingURL=studyresource.repository.js.map