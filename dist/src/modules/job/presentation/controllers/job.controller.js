"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobController = void 0;
const job_dto_1 = require("../../application/dto/job.dto");
class JobController {
    constructor(createJobUseCase, getJobsUseCase, updateJobStatusUseCase, updatePaymentStatusUseCase, deleteJobUseCase) {
        this.createJobUseCase = createJobUseCase;
        this.getJobsUseCase = getJobsUseCase;
        this.updateJobStatusUseCase = updateJobStatusUseCase;
        this.updatePaymentStatusUseCase = updatePaymentStatusUseCase;
        this.deleteJobUseCase = deleteJobUseCase;
    }
    async createJob(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const createJobDTO = {
                title: req.body.title,
                description: req.body.description,
                receiverId: req.body.receiverId,
                amount: req.body.amount
            };
            const result = await this.createJobUseCase.execute(userId, createJobDTO);
            res.status(201).json({
                success: true,
                message: 'Job created successfully',
                data: result
            });
        }
        catch (error) {
            console.error('Create job error:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Internal server error while creating job'
            });
        }
    }
    async getJob(req, res) {
        try {
            const userId = req.user?.userId;
            const jobId = req.params.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const job = await this.getJobsUseCase.getJobById(jobId, userId);
            if (!job) {
                res.status(404).json({
                    success: false,
                    message: 'Job not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: job
            });
        }
        catch (error) {
            console.error('Get job error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Internal server error while fetching job';
            const statusCode = errorMessage.includes('Access denied') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: errorMessage
            });
        }
    }
    async getJobs(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const filterDTO = new job_dto_1.JobFilterDTO(req.query.status, req.query.paymentStatus, req.query.search, req.query.dateFrom, req.query.dateTo, req.query.role, req.query.limit ? parseInt(req.query.limit) : undefined, req.query.offset ? parseInt(req.query.offset) : undefined, req.query.sortBy, req.query.sortOrder);
            const roleFilter = req.query.role;
            let jobs;
            if (roleFilter) {
                jobs = await this.getJobsUseCase.execute(userId, roleFilter, filterDTO);
            }
            else {
                const allJobs = await this.getJobsUseCase.getAllUserJobs(userId, filterDTO);
                jobs = allJobs.allJobs;
            }
            res.status(200).json({
                success: true,
                data: jobs,
                total: jobs.length
            });
        }
        catch (error) {
            console.error('Get jobs error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching jobs'
            });
        }
    }
    async getStatistics(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const roleFilter = req.query.role;
            const statistics = await this.getJobsUseCase.getStatistics(userId, roleFilter);
            res.status(200).json({
                success: true,
                data: statistics
            });
        }
        catch (error) {
            console.error('Get statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching statistics'
            });
        }
    }
    async getJobsNeedingAttention(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const jobs = await this.getJobsUseCase.getJobsNeedingAttention(userId);
            res.status(200).json({
                success: true,
                data: jobs
            });
        }
        catch (error) {
            console.error('Get jobs needing attention error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching jobs needing attention'
            });
        }
    }
    async updateJobStatus(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const jobId = req.params.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const updateDTO = new job_dto_1.UpdateJobStatusDTO(req.body.status);
            const job = await this.updateJobStatusUseCase.execute(jobId, userId, updateDTO);
            res.status(200).json({
                success: true,
                message: 'Job status updated successfully',
                data: job
            });
        }
        catch (error) {
            console.error('Update job status error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Internal server error while updating job status';
            const statusCode = errorMessage.includes('not found') ? 404 :
                errorMessage.includes('permission') || errorMessage.includes('cannot') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: errorMessage
            });
        }
    }
    async processPayment(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const jobId = req.params.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const result = await this.updatePaymentStatusUseCase.processJobPayment(jobId, userId);
            if (result.success && result.jobDTO) {
                res.status(200).json({
                    success: true,
                    message: 'Payment processed successfully',
                    data: {
                        job: result.jobDTO,
                        transactionId: result.transactionId
                    }
                });
            }
            else {
                const statusCode = result.error?.includes('not found') ? 404 :
                    result.error?.includes('permission') ? 403 : 400;
                res.status(statusCode).json({
                    success: false,
                    message: result.error || 'Failed to process payment'
                });
            }
        }
        catch (error) {
            console.error('Process payment error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while processing payment'
            });
        }
    }
    async updatePaymentStatus(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const jobId = req.params.id;
            const newStatus = req.body.paymentStatus;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const updateDTO = { paymentStatus: newStatus };
            const job = await this.updatePaymentStatusUseCase.execute(jobId, updateDTO);
            new job_dto_1.UpdatePaymentStatusDTO(newStatus);
            res.status(200).json({
                success: true,
                message: 'Payment status updated successfully',
                data: job
            });
        }
        catch (error) {
            console.error('Update payment status error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Internal server error while updating payment status';
            const statusCode = errorMessage.includes('not found') ? 404 :
                errorMessage.includes('permission') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: errorMessage
            });
        }
    }
    async deleteJob(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const jobId = req.params.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            await this.deleteJobUseCase.execute(jobId, userId);
            res.status(200).json({
                success: true,
                message: 'Job deleted successfully'
            });
        }
        catch (error) {
            console.error('Delete job error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Internal server error while deleting job';
            const statusCode = errorMessage.includes('not found') ? 404 :
                errorMessage.includes('permission') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: errorMessage
            });
        }
    }
    async batchUpdateJobs(req, res) {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            if (userRole !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: 'Admin access required for batch operations'
                });
                return;
            }
            const { jobIds, updateData } = req.body;
            if (!Array.isArray(jobIds) || jobIds.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Job IDs array is required'
                });
                return;
            }
            res.status(501).json({
                success: false,
                message: 'Batch update not implemented yet'
            });
        }
        catch (error) {
            console.error('Batch update error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while batch updating jobs'
            });
        }
    }
}
exports.JobController = JobController;
//# sourceMappingURL=job.controller.js.map