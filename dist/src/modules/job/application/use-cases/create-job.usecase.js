"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateJobUseCase = void 0;
const job_entity_1 = require("../../domain/entities/job.entity");
const mongoose_1 = require("mongoose");
class CreateJobUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(senderId, createJobData) {
        try {
            this.validateUserId(senderId);
            this.validateCreateJobData(createJobData);
            const jobEntity = job_entity_1.JobEntity.create(createJobData.title, createJobData.description, new mongoose_1.Types.ObjectId(senderId), new mongoose_1.Types.ObjectId(createJobData.receiverId), createJobData.amount);
            const amountValidation = jobEntity.validateAmount();
            if (!amountValidation.isValid) {
                throw new Error(amountValidation.error);
            }
            const savedJob = await this.repository.create(jobEntity);
            return savedJob;
        }
        catch (error) {
            throw new Error(`Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateUserId(senderId) {
        if (!senderId || senderId.trim().length === 0) {
            throw new Error('Sender ID is required');
        }
        try {
            new mongoose_1.Types.ObjectId(senderId);
        }
        catch {
            throw new Error('Invalid sender ID format');
        }
    }
    validateCreateJobData(data) {
        if (!data.title || data.title.trim().length < 2 || data.title.trim().length > 200) {
            throw new Error('Title must be between 2 and 200 characters');
        }
        if (data.description && data.description.length > 2000) {
            throw new Error('Description cannot exceed 2000 characters');
        }
        if (!data.receiverId || data.receiverId.trim().length === 0) {
            throw new Error('Receiver ID is required');
        }
        try {
            new mongoose_1.Types.ObjectId(data.receiverId);
        }
        catch {
            throw new Error('Invalid receiver ID format');
        }
        if (typeof data.amount !== 'number' || data.amount <= 0) {
            throw new Error('Amount must be a positive number');
        }
        if (data.receiverId === data.receiverId) {
        }
    }
}
exports.CreateJobUseCase = CreateJobUseCase;
//# sourceMappingURL=create-job.usecase.js.map