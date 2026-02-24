"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetJobsUseCase = void 0;
const job_dto_1 = require("../dto/job.dto");
const mongoose_1 = require("mongoose");
class GetJobsUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(userId, role, filterDTO) {
        try {
            this.validateUserId(userId);
            this.validateRole(role);
            const filter = this.convertFilterDTOToFilter(filterDTO);
            const jobs = await this.repository.getByUser(userId, role, filter);
            return this.sortJobs(jobs, filterDTO?.sortBy, filterDTO?.sortOrder);
        }
        catch (error) {
            throw new Error(`Failed to retrieve jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAllUserJobs(userId, filterDTO) {
        try {
            this.validateUserId(userId);
            const filter = this.convertFilterDTOToFilter(filterDTO);
            const [sentJobs, receivedJobs] = await Promise.all([
                this.repository.getByUser(userId, 'sender', filter),
                this.repository.getByUser(userId, 'receiver', filter)
            ]);
            const allJobs = [...sentJobs, ...receivedJobs];
            const sortedAllJobs = this.sortJobs(allJobs, filterDTO?.sortBy, filterDTO?.sortOrder);
            return {
                sentJobs: this.sortJobs(sentJobs, filterDTO?.sortBy, filterDTO?.sortOrder),
                receivedJobs: this.sortJobs(receivedJobs, filterDTO?.sortBy, filterDTO?.sortOrder),
                allJobs: sortedAllJobs
            };
        }
        catch (error) {
            throw new Error(`Failed to retrieve all user jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getJobById(jobId, userId) {
        try {
            this.validateUserId(userId);
            this.validateJobId(jobId);
            const hasAccess = await this.repository.hasAccess(jobId, userId);
            if (!hasAccess) {
                throw new Error('Access denied: You can only view jobs you are involved in');
            }
            return await this.repository.getById(jobId);
        }
        catch (error) {
            throw new Error(`Failed to retrieve job: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getStatistics(userId, role) {
        try {
            this.validateUserId(userId);
            if (role) {
                this.validateRole(role);
            }
            const stats = await this.repository.getStatistics(userId, role);
            const averageJobValue = stats.totalJobs > 0 ? stats.totalEarnings / stats.totalJobs : 0;
            const completionRate = stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0;
            return new job_dto_1.JobStatisticsDTO(stats.totalJobs, stats.activeJobs, stats.completedJobs, stats.cancelledJobs, stats.totalEarnings, stats.totalEarnings, stats.pendingPayments, stats.jobsByStatus, stats.jobsByPaymentStatus, averageJobValue, completionRate);
        }
        catch (error) {
            throw new Error(`Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getJobsNeedingAttention(userId) {
        try {
            this.validateUserId(userId);
            return await this.repository.getJobsNeedingAttention(userId);
        }
        catch (error) {
            throw new Error(`Failed to get jobs needing attention: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    validateRole(role) {
        if (!['sender', 'receiver'].includes(role)) {
            throw new Error('Role must be either "sender" or "receiver"');
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
    convertFilterDTOToFilter(filterDTO) {
        if (!filterDTO)
            return undefined;
        const filter = {};
        if (filterDTO.status)
            filter.status = filterDTO.status;
        if (filterDTO.paymentStatus)
            filter.paymentStatus = filterDTO.paymentStatus;
        if (filterDTO.search)
            filter.search = filterDTO.search;
        if (filterDTO.dateFrom)
            filter.dateFrom = new Date(filterDTO.dateFrom);
        if (filterDTO.dateTo)
            filter.dateTo = new Date(filterDTO.dateTo);
        return filter;
    }
    sortJobs(jobs, sortBy, sortOrder) {
        if (!sortBy) {
            return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        const order = sortOrder === 'asc' ? 1 : -1;
        return jobs.sort((a, b) => {
            let aValue;
            let bValue;
            switch (sortBy) {
                case 'createdAt':
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                    break;
                case 'amount':
                    aValue = a.amount;
                    bValue = b.amount;
                    break;
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                default:
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
            }
            if (aValue < bValue)
                return -order;
            if (aValue > bValue)
                return order;
            return 0;
        });
    }
}
exports.GetJobsUseCase = GetJobsUseCase;
//# sourceMappingURL=get-jobs.usecase.js.map