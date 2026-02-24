"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMyResourcesUseCase = void 0;
const mongoose_1 = require("mongoose");
class GetMyResourcesUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(tutorId) {
        try {
            this.validateTutorId(tutorId);
            const resources = await this.repository.getMyResources(tutorId);
            return resources.map(resource => resource.toTutorDTO());
        }
        catch (error) {
            throw new Error(`Failed to retrieve tutor resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getStatistics(tutorId) {
        try {
            this.validateTutorId(tutorId);
            return await this.repository.getResourceStatistics(tutorId);
        }
        catch (error) {
            throw new Error(`Failed to retrieve resource statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
}
exports.GetMyResourcesUseCase = GetMyResourcesUseCase;
//# sourceMappingURL=get-my-resources.usecase.js.map