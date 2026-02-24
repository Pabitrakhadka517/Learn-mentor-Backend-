"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePaymentStatusUseCase = void 0;
const mongoose_1 = require("mongoose");
class UpdatePaymentStatusUseCase {
    constructor(repository, transactionService) {
        this.repository = repository;
        this.transactionService = transactionService;
    }
    async execute(jobId, updatePaymentData) {
        try {
            this.validateJobId(jobId);
            this.validateUpdatePaymentData(updatePaymentData);
            const currentJob = await this.repository.findEntityById(jobId);
            if (!currentJob) {
                throw new Error('Job not found');
            }
            const updatedEntity = currentJob.updatePaymentStatus(updatePaymentData.paymentStatus);
            if (updatePaymentData.paymentStatus === 'done' && this.transactionService) {
                await this.processPaymentThroughTransactionService(currentJob.id.toString(), currentJob);
            }
            const updatedJob = await this.repository.updateJob(updatedEntity);
            return updatedJob;
        }
        catch (error) {
            throw new Error(`Failed to update payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async processJobPayment(jobId, senderId) {
        try {
            this.validateJobId(jobId);
            this.validateUserId(senderId);
            const job = await this.repository.findEntityById(jobId);
            if (!job) {
                return { success: false, error: 'Job not found' };
            }
            if (job.senderId.toString() !== senderId) {
                return { success: false, error: 'Only job creator can process payment' };
            }
            if (job.paymentStatus !== 'pending') {
                return { success: false, error: `Payment is already ${job.paymentStatus}` };
            }
            if (!this.transactionService) {
                return { success: false, error: 'Transaction service not available' };
            }
            const paymentResult = await this.transactionService.processPayment(jobId, job.amount, job.senderId.toString(), job.receiverId.toString());
            let updatedJob;
            if (paymentResult.success) {
                const updatedEntity = job.updatePaymentStatus('done');
                updatedJob = await this.repository.updateJob(updatedEntity);
            }
            else {
                const updatedEntity = job.updatePaymentStatus('failed');
                updatedJob = await this.repository.updateJob(updatedEntity);
            }
            return {
                success: paymentResult.success,
                jobDTO: updatedJob,
                transactionId: paymentResult.transactionId,
                error: paymentResult.error
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async refundJobPayment(jobId, transactionId, userId) {
        try {
            this.validateJobId(jobId);
            this.validateUserId(userId);
            const job = await this.repository.findEntityById(jobId);
            if (!job) {
                return { success: false, error: 'Job not found' };
            }
            if (job.senderId.toString() !== userId) {
                return { success: false, error: 'Only job creator can request refund' };
            }
            if (job.paymentStatus !== 'done') {
                return { success: false, error: 'Can only refund completed payments' };
            }
            if (!this.transactionService) {
                return { success: false, error: 'Transaction service not available' };
            }
            const refundSuccess = await this.transactionService.refundPayment(transactionId);
            if (refundSuccess) {
                const updatedEntity = job.updatePaymentStatus('pending');
                const updatedJob = await this.repository.updateJob(updatedEntity);
                return { success: true, jobDTO: updatedJob };
            }
            else {
                return { success: false, error: 'Refund processing failed' };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getValidPaymentTransitions(jobId) {
        try {
            this.validateJobId(jobId);
            const job = await this.repository.findEntityById(jobId);
            if (!job) {
                throw new Error('Job not found');
            }
            const validTransitions = {
                'pending': ['done', 'failed'],
                'done': [],
                'failed': ['pending', 'done']
            };
            return validTransitions[job.paymentStatus] || [];
        }
        catch (error) {
            throw new Error(`Failed to get valid payment transitions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async processPaymentThroughTransactionService(jobId, job) {
        if (!this.transactionService) {
            return;
        }
        try {
            const paymentResult = await this.transactionService.processPayment(jobId, job.amount, job.senderId.toString(), job.receiverId.toString());
            if (!paymentResult.success) {
                console.warn(`Transaction service failed for job ${jobId}:`, paymentResult.error);
            }
        }
        catch (error) {
            console.error(`Error processing payment through transaction service:`, error);
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
    validateUpdatePaymentData(data) {
        const validPaymentStatuses = ['pending', 'done', 'failed'];
        if (!data.paymentStatus || !validPaymentStatuses.includes(data.paymentStatus)) {
            throw new Error(`Payment status must be one of: ${validPaymentStatuses.join(', ')}`);
        }
    }
}
exports.UpdatePaymentStatusUseCase = UpdatePaymentStatusUseCase;
//# sourceMappingURL=update-payment-status.usecase.js.map