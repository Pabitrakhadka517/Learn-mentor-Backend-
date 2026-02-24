"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRepository = void 0;
const job_entity_1 = require("../../domain/entities/job.entity");
const job_dto_1 = require("../../application/dto/job.dto");
const job_model_1 = require("../../job.model");
const mongoose_1 = require("mongoose");
class JobRepository {
    async create(job) {
        try {
            const newJob = new job_model_1.Job({
                title: job.title,
                description: job.description || '',
                sender: job.senderId,
                receiver: job.receiverId,
                amount: job.amount,
                status: job.status,
                paymentStatus: job.paymentStatus
            });
            const saved = await newJob.save();
            await saved.populate(['sender', 'receiver'], 'fullName email');
            return this.mapToDTO(saved);
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('duplicate key')) {
                throw new Error('A similar job already exists');
            }
            throw new Error(`Failed to create job: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async getById(jobId) {
        try {
            const objectId = new mongoose_1.Types.ObjectId(jobId);
            const job = await job_model_1.Job.findById(objectId)
                .populate('sender', 'fullName email')
                .populate('receiver', 'fullName email')
                .lean()
                .exec();
            return job ? this.mapToDTO(job) : null;
        }
        catch (error) {
            throw new Error(`Failed to find job: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async getByUser(userId, role, filter) {
        try {
            const objectId = new mongoose_1.Types.ObjectId(userId);
            let query = {};
            if (role === 'sender') {
                query.sender = objectId;
            }
            else {
                query.receiver = objectId;
            }
            if (filter) {
                if (filter.status) {
                    query.status = filter.status;
                }
                if (filter.paymentStatus) {
                    query.paymentStatus = filter.paymentStatus;
                }
                if (filter.search) {
                    query.$or = [
                        { title: { $regex: filter.search, $options: 'i' } },
                        { description: { $regex: filter.search, $options: 'i' } }
                    ];
                }
                if (filter.dateFrom || filter.dateTo) {
                    query.createdAt = {};
                    if (filter.dateFrom) {
                        query.createdAt.$gte = filter.dateFrom;
                    }
                    if (filter.dateTo) {
                        query.createdAt.$lte = filter.dateTo;
                    }
                }
            }
            const jobs = await job_model_1.Job.find(query)
                .populate('sender', 'fullName email')
                .populate('receiver', 'fullName email')
                .sort({ createdAt: -1 })
                .lean()
                .exec();
            return jobs.map(job => this.mapToDTO(job));
        }
        catch (error) {
            throw new Error(`Failed to get user jobs: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async getAllUserJobs(userId, filter) {
        try {
            const objectId = new mongoose_1.Types.ObjectId(userId);
            let query = {
                $or: [
                    { sender: objectId },
                    { receiver: objectId }
                ]
            };
            if (filter) {
                if (filter.status) {
                    query.status = filter.status;
                }
                if (filter.paymentStatus) {
                    query.paymentStatus = filter.paymentStatus;
                }
                if (filter.search) {
                    const searchConditions = [
                        { title: { $regex: filter.search, $options: 'i' } },
                        { description: { $regex: filter.search, $options: 'i' } }
                    ];
                    query.$and = query.$and || [];
                    query.$and.push({ $or: searchConditions });
                }
                if (filter.dateFrom || filter.dateTo) {
                    query.createdAt = {};
                    if (filter.dateFrom) {
                        query.createdAt.$gte = filter.dateFrom;
                    }
                    if (filter.dateTo) {
                        query.createdAt.$lte = filter.dateTo;
                    }
                }
            }
            const jobs = await job_model_1.Job.find(query)
                .populate('sender', 'fullName email')
                .populate('receiver', 'fullName email')
                .sort({ createdAt: -1 })
                .lean()
                .exec();
            return jobs.map(job => this.mapToDTO(job));
        }
        catch (error) {
            throw new Error(`Failed to get all user jobs: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async updateStatus(jobId, status) {
        try {
            const objectId = new mongoose_1.Types.ObjectId(jobId);
            const updatedJob = await job_model_1.Job.findByIdAndUpdate(objectId, { status, updatedAt: new Date() }, { new: true, lean: true })
                .populate('sender', 'fullName email')
                .populate('receiver', 'fullName email')
                .exec();
            if (!updatedJob) {
                throw new Error('Job not found');
            }
            return this.mapToDTO(updatedJob);
        }
        catch (error) {
            throw new Error(`Failed to update job status: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async updatePaymentStatus(jobId, paymentStatus) {
        try {
            const objectId = new mongoose_1.Types.ObjectId(jobId);
            const updatedJob = await job_model_1.Job.findByIdAndUpdate(objectId, { paymentStatus, updatedAt: new Date() }, { new: true, lean: true })
                .populate('sender', 'fullName email')
                .populate('receiver', 'fullName email')
                .exec();
            if (!updatedJob) {
                throw new Error('Job not found');
            }
            return this.mapToDTO(updatedJob);
        }
        catch (error) {
            throw new Error(`Failed to update payment status: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async delete(jobId, userId) {
        try {
            const jobObjectId = new mongoose_1.Types.ObjectId(jobId);
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            const result = await job_model_1.Job.deleteOne({
                _id: jobObjectId,
                sender: userObjectId
            });
            if (result.deletedCount === 0) {
                throw new Error('Job not found or you do not have permission to delete it');
            }
        }
        catch (error) {
            throw new Error(`Failed to delete job: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async findEntityById(jobId) {
        try {
            const objectId = new mongoose_1.Types.ObjectId(jobId);
            const job = await job_model_1.Job.findById(objectId).lean().exec();
            return job ? this.mapToEntity(job) : null;
        }
        catch (error) {
            throw new Error(`Failed to find job entity: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async updateJob(job) {
        try {
            const updatedJob = await job_model_1.Job.findByIdAndUpdate(job.id, {
                title: job.title,
                description: job.description,
                status: job.status,
                paymentStatus: job.paymentStatus,
                updatedAt: new Date()
            }, { new: true, lean: true })
                .populate('sender', 'fullName email')
                .populate('receiver', 'fullName email')
                .exec();
            if (!updatedJob) {
                throw new Error('Job not found');
            }
            return this.mapToDTO(updatedJob);
        }
        catch (error) {
            throw new Error(`Failed to update job: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async hasAccess(jobId, userId) {
        try {
            const jobObjectId = new mongoose_1.Types.ObjectId(jobId);
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            const count = await job_model_1.Job.countDocuments({
                _id: jobObjectId,
                $or: [
                    { sender: userObjectId },
                    { receiver: userObjectId }
                ]
            });
            return count > 0;
        }
        catch (error) {
            return false;
        }
    }
    async getStatistics(userId, role) {
        try {
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            const matchStage = {};
            if (role === 'sender') {
                matchStage.sender = userObjectId;
            }
            else if (role === 'receiver') {
                matchStage.receiver = userObjectId;
            }
            else {
                matchStage.$or = [
                    { sender: userObjectId },
                    { receiver: userObjectId }
                ];
            }
            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalJobs: { $sum: 1 },
                        activeJobs: {
                            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                        },
                        completedJobs: {
                            $sum: { $cond: [{ $eq: ['$status', 'finished'] }, 1, 0] }
                        },
                        cancelledJobs: {
                            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                        },
                        totalEarnings: { $sum: '$amount' },
                        pendingPayments: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$paymentStatus', 'pending'] },
                                    '$amount',
                                    0
                                ]
                            }
                        },
                        statusGroups: { $push: '$status' },
                        paymentStatusGroups: { $push: '$paymentStatus' }
                    }
                }
            ];
            const result = await job_model_1.Job.aggregate(pipeline);
            if (result.length === 0) {
                return {
                    totalJobs: 0,
                    activeJobs: 0,
                    completedJobs: 0,
                    cancelledJobs: 0,
                    totalEarnings: 0,
                    pendingPayments: 0,
                    jobsByStatus: { pending: 0, active: 0, finished: 0, cancelled: 0 },
                    jobsByPaymentStatus: { pending: 0, done: 0, failed: 0 }
                };
            }
            const stats = result[0];
            const jobsByStatus = { pending: 0, active: 0, finished: 0, cancelled: 0 };
            stats.statusGroups.forEach((status) => {
                jobsByStatus[status]++;
            });
            const jobsByPaymentStatus = { pending: 0, done: 0, failed: 0 };
            stats.paymentStatusGroups.forEach((paymentStatus) => {
                jobsByPaymentStatus[paymentStatus]++;
            });
            return {
                totalJobs: stats.totalJobs,
                activeJobs: stats.activeJobs,
                completedJobs: stats.completedJobs,
                cancelledJobs: stats.cancelledJobs,
                totalEarnings: stats.totalEarnings,
                pendingPayments: stats.pendingPayments,
                jobsByStatus,
                jobsByPaymentStatus
            };
        }
        catch (error) {
            throw new Error(`Failed to get job statistics: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    async batchUpdate(jobIds, updateData) {
        const results = {
            updated: [],
            failed: []
        };
        for (const jobId of jobIds) {
            try {
                const objectId = new mongoose_1.Types.ObjectId(jobId);
                const result = await job_model_1.Job.updateOne({ _id: objectId }, { ...updateData, updatedAt: new Date() });
                if (result.modifiedCount > 0) {
                    results.updated.push(jobId);
                }
                else {
                    results.failed.push(jobId);
                }
            }
            catch (error) {
                results.failed.push(jobId);
            }
        }
        return results;
    }
    async getJobsNeedingAttention(userId) {
        try {
            const userObjectId = new mongoose_1.Types.ObjectId(userId);
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const query = {
                $or: [
                    { sender: userObjectId },
                    { receiver: userObjectId }
                ],
                $and: [
                    {
                        $or: [
                            { status: 'pending', createdAt: { $lt: twentyFourHoursAgo } },
                            { paymentStatus: 'failed' },
                            { status: 'active', paymentStatus: 'pending' }
                        ]
                    }
                ]
            };
            const jobs = await job_model_1.Job.find(query)
                .populate('sender', 'fullName email')
                .populate('receiver', 'fullName email')
                .sort({ createdAt: -1 })
                .lean()
                .exec();
            return jobs.map(job => this.mapToDTO(job));
        }
        catch (error) {
            throw new Error(`Failed to get jobs needing attention: ${error instanceof Error ? error.message : 'Database error'}`);
        }
    }
    mapToDTO(job) {
        return new job_dto_1.JobDTO(job._id.toString(), job.title, job.description || null, job.sender._id?.toString() || job.sender.toString(), job.receiver._id?.toString() || job.receiver.toString(), job.amount, job.status, job.paymentStatus, job.createdAt, job.updatedAt, job.sender.fullName, job.receiver.fullName, job.sender.email, job.receiver.email);
    }
    mapToEntity(job) {
        return new job_entity_1.JobEntity(job.title, job.description || null, job.sender, job.receiver, job.amount, job.status, job.paymentStatus, job.createdAt, job.updatedAt, job._id);
    }
}
exports.JobRepository = JobRepository;
//# sourceMappingURL=job.repository.js.map