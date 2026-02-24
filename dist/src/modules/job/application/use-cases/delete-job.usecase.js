"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteJobUseCase = void 0;
const mongoose_1 = require("mongoose");
class DeleteJobUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(jobId, userId) {
        try {
            this.validateJobId(jobId);
            this.validateUserId(userId);
            const currentJob = await this.repository.findEntityById(jobId);
            if (!currentJob) {
                throw new Error('Job not found');
            }
            const canDelete = currentJob.canBeDeletedBy(new mongoose_1.Types.ObjectId(userId));
            if (!canDelete.isValid) {
                throw new Error(canDelete.error);
            }
            await this.repository.delete(jobId, userId);
        }
        catch (error) {
            throw new Error(`Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async softDelete(jobId, userId) {
        try {
            this.validateJobId(jobId);
            this.validateUserId(userId);
            const currentJob = await this.repository.findEntityById(jobId);
            if (!currentJob) {
                throw new Error('Job not found');
            }
            if (currentJob.senderId.toString() !== userId) {
                throw new Error('Only job creator can cancel the job');
            }
            if (currentJob.status === 'finished' || currentJob.paymentStatus === 'done') {
                throw new Error('Cannot cancel completed jobs or jobs with completed payments');
            }
            const updatedEntity = currentJob.updateStatus('cancelled');
            await this.repository.updateJob(updatedEntity);
        }
        catch (error) {
            throw new Error(`Failed to cancel job: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async batchDelete(jobIds, userId) {
        const results = {
            deleted: [],
            failed: []
        };
        for (const jobId of jobIds) {
            try {
                await this.execute(jobId, userId);
                results.deleted.push(jobId);
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
    async batchSoftDelete(jobIds, userId) {
        const results = {
            cancelled: [],
            failed: []
        };
        for (const jobId of jobIds) {
            try {
                await this.softDelete(jobId, userId);
                results.cancelled.push(jobId);
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
    async canDelete(jobId, userId) {
        try {
            this.validateJobId(jobId);
            this.validateUserId(userId);
            const job = await this.repository.findEntityById(jobId);
            if (!job) {
                return { canDelete: false, reason: 'Job not found' };
            }
            const canDeleteResult = job.canBeDeletedBy(new mongoose_1.Types.ObjectId(userId));
            return {
                canDelete: canDeleteResult.isValid,
                reason: canDeleteResult.error
            };
        }
        catch (error) {
            return {
                canDelete: false,
                reason: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getDeleteOptions(jobId, userId) {
        try {
            this.validateJobId(jobId);
            this.validateUserId(userId);
            const job = await this.repository.findEntityById(jobId);
            if (!job) {
                return {
                    canHardDelete: false,
                    canSoftDelete: false,
                    restrictions: ['Job not found']
                };
            }
            const restrictions = [];
            const canDeleteResult = job.canBeDeletedBy(new mongoose_1.Types.ObjectId(userId));
            const isOwner = job.senderId.toString() === userId;
            let canHardDelete = canDeleteResult.isValid;
            let canSoftDelete = isOwner && !job.isTerminal();
            if (!isOwner) {
                restrictions.push('Only job creator can delete/cancel jobs');
                canSoftDelete = false;
            }
            if (job.status === 'active') {
                restrictions.push('Active jobs cannot be hard deleted');
                canHardDelete = false;
            }
            if (job.paymentStatus === 'done') {
                restrictions.push('Jobs with completed payments cannot be deleted');
                canHardDelete = false;
            }
            if (job.isTerminal()) {
                restrictions.push('Completed/cancelled jobs cannot be soft deleted');
                canSoftDelete = false;
            }
            return {
                canHardDelete,
                canSoftDelete,
                restrictions
            };
        }
        catch (error) {
            return {
                canHardDelete: false,
                canSoftDelete: false,
                restrictions: [error instanceof Error ? error.message : 'Unknown error']
            };
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
}
exports.DeleteJobUseCase = DeleteJobUseCase;
//# sourceMappingURL=delete-job.usecase.js.map