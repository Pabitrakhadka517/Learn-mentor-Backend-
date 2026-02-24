"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPublicResourcesUseCase = void 0;
const studyresource_dto_1 = require("../dto/studyresource.dto");
class GetPublicResourcesUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(filter) {
        try {
            this.validateFilter(filter);
            const resources = await this.repository.getPublicResources(filter);
            return resources.map(resource => {
                const dto = new studyresource_dto_1.StudyResourceDTO(resource.id, resource.title, resource.category, resource.type, resource.url, resource.size, resource.tutorId, resource.isPublic, resource.createdAt, resource.updatedAt, resource.tutorName, resource.downloadCount);
                return dto.toPublicDTO();
            });
        }
        catch (error) {
            throw new Error(`Failed to retrieve public resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateFilter(filter) {
        if (filter) {
            if (filter.category && filter.category.trim().length === 0) {
                throw new Error('Category filter cannot be empty');
            }
            if (filter.search && filter.search.trim().length < 2) {
                throw new Error('Search term must be at least 2 characters');
            }
        }
    }
}
exports.GetPublicResourcesUseCase = GetPublicResourcesUseCase;
//# sourceMappingURL=get-public-resources.usecase.js.map