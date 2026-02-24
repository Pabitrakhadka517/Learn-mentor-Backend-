"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateJobStatusUseCase = void 0;
const job_dto_1 = require("../dto/job.dto");
const mongoose_1 = require("mongoose");
class UpdateJobStatusUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(jobId, userId, updateStatusData) {
        try {
            this.validateJobId(jobId);
            this.validateUserId(userId);
            this.validateUpdateStatusData(updateStatusData);
            const currentJob = await this.repository.findEntityById(jobId);
            if (!currentJob) {
                throw new Error('Job not found');
            }
            const canUpdate = currentJob.canUpdateStatus(new mongoose_1.Types.ObjectId(userId));
            if (!canUpdate.isValid) {
                throw new Error(canUpdate.error);
            }
            const updatedEntity = currentJob.updateStatus(updateStatusData.status);
            const updatedJob = await this.repository.updateJob(updatedEntity);
            return updatedJob;
        }
        catch (error) {
            throw new Error(`Failed to update job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async batchUpdateStatus(jobIds, userId, newStatus) {
        const results = {
            updated: [],
            failed: []
        };
        for (const jobId of jobIds) {
            try {
                await this.execute(jobId, userId, new job_dto_1.UpdateJobStatusDTO(newStatus));
                results.updated.push(jobId);
            }
            catch (error) {
                results.failed.push({
                    id: jobId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return results;
    }
    async getValidTransitions(jobId, userId) {
        try {
            this.validateJobId(jobId);
            this.validateUserId(userId);
            const job = await this.repository.findEntityById(jobId);
            if (!job) {
                throw new Error('Job not found');
            }
            const canUpdate = job.canUpdateStatus(new mongoose_1.Types.ObjectId(userId));
            if (!canUpdate.isValid) {
                return [];
            }
            const validTransitions = {
                'pending': ['active', 'cancelled'],
                'active': ['finished', 'cancelled'],
                'finished': [],
                'cancelled': []
            };
            return validTransitions[job.status] || [];
        }
        catch (error) {
            throw new Error(`Failed to get valid transitions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async autoTransitionJobs() {
        try {
            return { transitioned: 0, errors: [] };
        }
        catch (error) {
            throw new Error(`Auto-transition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateJobId(jobId) {
        if (!jobId || jobId.trim().length === 0) {
            throw new Error('Job ID is required');
        }
        try {
            new mongoose_1.Types.ObjectId(jobId);
        }
        catch {
            throw new Error('Invalid job ID format');
        }
    }
    validateUserId(userId) {
        if (!userId || userId.trim().length === 0) {
            throw new Error('User ID is required');
        }
        try {
            new mongoose_1.Types.ObjectId(userId);
        }
        catch {
            throw new Error('Invalid user ID format');
        }
    }
    validateUpdateStatusData(data) {
        const validStatuses = ['pending', 'active', 'finished', 'cancelled'];
        if (!data.status || !validStatuses.includes(data.status)) {
            throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
        }
    }
}
exports.UpdateJobStatusUseCase = UpdateJobStatusUseCase;
//# sourceMappingURL=update-job-status.usecase.js.map