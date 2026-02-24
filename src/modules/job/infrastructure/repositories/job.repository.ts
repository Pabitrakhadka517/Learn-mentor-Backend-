import { IJobRepository, JobFilter, JobStatistics } from '../../domain/interfaces/job.repository.interface';
import { JobEntity, JobStatus, PaymentStatus } from '../../domain/entities/job.entity';
import { JobDTO } from '../../application/dto/job.dto';
import { Job, IJob } from '../../job.model';
import { Types } from 'mongoose';

/**
 * MongoDB implementation of the Job repository
 * Handles all database operations for jobs
 */
export class JobRepository implements IJobRepository {
  /**
   * Creates a new job
   */
  async create(job: JobEntity): Promise<JobDTO> {
    try {
      const newJob = new Job({
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
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('A similar job already exists');
      }
      throw new Error(`Failed to create job: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Finds a job by ID
   */
  async getById(jobId: string): Promise<JobDTO | null> {
    try {
      const objectId = new Types.ObjectId(jobId);
      const job = await Job.findById(objectId)
        .populate('sender', 'fullName email')
        .populate('receiver', 'fullName email')
        .lean()
        .exec();
      
      return job ? this.mapToDTO(job) : null;
    } catch (error) {
      throw new Error(`Failed to find job: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Gets jobs by user role (sender or receiver)
   */
  async getByUser(
    userId: string, 
    role: "sender" | "receiver", 
    filter?: JobFilter
  ): Promise<JobDTO[]> {
    try {
      const objectId = new Types.ObjectId(userId);
      let query: any = {};

      // Set role filter
      if (role === 'sender') {
        query.sender = objectId;
      } else {
        query.receiver = objectId;
      }

      // Apply filters
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

      const jobs = await Job.find(query)
        .populate('sender', 'fullName email')
        .populate('receiver', 'fullName email')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return jobs.map(job => this.mapToDTO(job));
    } catch (error) {
      throw new Error(`Failed to get user jobs: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Gets all jobs for a user (both sent and received)
   */
  async getAllUserJobs(userId: string, filter?: JobFilter): Promise<JobDTO[]> {
    try {
      const objectId = new Types.ObjectId(userId);
      let query: any = {
        $or: [
          { sender: objectId },
          { receiver: objectId }
        ]
      };

      // Apply filters
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

      const jobs = await Job.find(query)
        .populate('sender', 'fullName email')
        .populate('receiver', 'fullName email')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return jobs.map(job => this.mapToDTO(job));
    } catch (error) {
      throw new Error(`Failed to get all user jobs: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Updates job status
   */
  async updateStatus(jobId: string, status: JobStatus): Promise<JobDTO> {
    try {
      const objectId = new Types.ObjectId(jobId);
      const updatedJob = await Job.findByIdAndUpdate(
        objectId,
        { status, updatedAt: new Date() },
        { new: true, lean: true }
      )
      .populate('sender', 'fullName email')
      .populate('receiver', 'fullName email')
      .exec();

      if (!updatedJob) {
        throw new Error('Job not found');
      }

      return this.mapToDTO(updatedJob);
    } catch (error) {
      throw new Error(`Failed to update job status: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Updates payment status
   */
  async updatePaymentStatus(jobId: string, paymentStatus: PaymentStatus): Promise<JobDTO> {
    try {
      const objectId = new Types.ObjectId(jobId);
      const updatedJob = await Job.findByIdAndUpdate(
        objectId,
        { paymentStatus, updatedAt: new Date() },
        { new: true, lean: true }
      )
      .populate('sender', 'fullName email')
      .populate('receiver', 'fullName email')
      .exec();

      if (!updatedJob) {
        throw new Error('Job not found');
      }

      return this.mapToDTO(updatedJob);
    } catch (error) {
      throw new Error(`Failed to update payment status: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Deletes a job
   */
  async delete(jobId: string, userId: string): Promise<void> {
    try {
      const jobObjectId = new Types.ObjectId(jobId);
      const userObjectId = new Types.ObjectId(userId);

      const result = await Job.deleteOne({
        _id: jobObjectId,
        sender: userObjectId // Only sender can delete
      });

      if (result.deletedCount === 0) {
        throw new Error('Job not found or you do not have permission to delete it');
      }
    } catch (error) {
      throw new Error(`Failed to delete job: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Finds a job entity by ID
   */
  async findEntityById(jobId: string): Promise<JobEntity | null> {
    try {
      const objectId = new Types.ObjectId(jobId);
      const job = await Job.findById(objectId).lean().exec();
      
      return job ? this.mapToEntity(job) : null;
    } catch (error) {
      throw new Error(`Failed to find job entity: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Updates a job entity
   */
  async updateJob(job: JobEntity): Promise<JobDTO> {
    try {
      const updatedJob = await Job.findByIdAndUpdate(
        job.id,
        {
          title: job.title,
          description: job.description,
          status: job.status,
          paymentStatus: job.paymentStatus,
          updatedAt: new Date()
        },
        { new: true, lean: true }
      )
      .populate('sender', 'fullName email')
      .populate('receiver', 'fullName email')
      .exec();

      if (!updatedJob) {
        throw new Error('Job not found');
      }

      return this.mapToDTO(updatedJob);
    } catch (error) {
      throw new Error(`Failed to update job: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Checks if a user has permission to access a job
   */
  async hasAccess(jobId: string, userId: string): Promise<boolean> {
    try {
      const jobObjectId = new Types.ObjectId(jobId);
      const userObjectId = new Types.ObjectId(userId);

      const count = await Job.countDocuments({
        _id: jobObjectId,
        $or: [
          { sender: userObjectId },
          { receiver: userObjectId }
        ]
      });

      return count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets job statistics for a user
   */
  async getStatistics(userId: string, role?: "sender" | "receiver"): Promise<JobStatistics> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      const matchStage: any = {};

      if (role === 'sender') {
        matchStage.sender = userObjectId;
      } else if (role === 'receiver') {
        matchStage.receiver = userObjectId;
      } else {
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

      const result = await Job.aggregate(pipeline);
      
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
      
      // Count jobs by status
      const jobsByStatus = { pending: 0, active: 0, finished: 0, cancelled: 0 };
      stats.statusGroups.forEach((status: JobStatus) => {
        jobsByStatus[status]++;
      });

      // Count jobs by payment status
      const jobsByPaymentStatus = { pending: 0, done: 0, failed: 0 };
      stats.paymentStatusGroups.forEach((paymentStatus: PaymentStatus) => {
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
    } catch (error) {
      throw new Error(`Failed to get job statistics: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Batch updates multiple jobs
   */
  async batchUpdate(
    jobIds: string[], 
    updateData: Partial<{ status: JobStatus; paymentStatus: PaymentStatus }>
  ): Promise<{ updated: string[]; failed: string[] }> {
    const results = {
      updated: [] as string[],
      failed: [] as string[]
    };

    for (const jobId of jobIds) {
      try {
        const objectId = new Types.ObjectId(jobId);
        const result = await Job.updateOne(
          { _id: objectId },
          { ...updateData, updatedAt: new Date() }
        );

        if (result.modifiedCount > 0) {
          results.updated.push(jobId);
        } else {
          results.failed.push(jobId);
        }
      } catch (error) {
        results.failed.push(jobId);
      }
    }

    return results;
  }

  /**
   * Gets jobs that need attention
   */
  async getJobsNeedingAttention(userId: string): Promise<JobDTO[]> {
    try {
      const userObjectId = new Types.ObjectId(userId);
      
      // Jobs needing attention:
      // 1. Pending jobs older than 24 hours
      // 2. Failed payments
      // 3. Active jobs with pending payments
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

      const jobs = await Job.find(query)
        .populate('sender', 'fullName email')
        .populate('receiver', 'fullName email')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return jobs.map(job => this.mapToDTO(job));
    } catch (error) {
      throw new Error(`Failed to get jobs needing attention: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Maps MongoDB document to DTO
   */
  private mapToDTO(job: any): JobDTO {
    return new JobDTO(
      job._id.toString(),
      job.title,
      job.description || null,
      job.sender._id?.toString() || job.sender.toString(),
      job.receiver._id?.toString() || job.receiver.toString(),
      job.amount,
      job.status,
      job.paymentStatus,
      job.createdAt,
      job.updatedAt,
      job.sender.fullName,
      job.receiver.fullName,
      job.sender.email,
      job.receiver.email
    );
  }

  /**
   * Maps MongoDB document to Entity
   */
  private mapToEntity(job: any): JobEntity {
    return new JobEntity(
      job.title,
      job.description || null,
      job.sender,
      job.receiver,
      job.amount,
      job.status,
      job.paymentStatus,
      job.createdAt,
      job.updatedAt,
      job._id
    );
  }
}