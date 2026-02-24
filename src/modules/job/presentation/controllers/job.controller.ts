import { Response } from 'express';
import { AuthRequest } from '../../../auth/auth.middleware';
import { CreateJobDTO, JobDTO, UpdateJobStatusDTO, UpdatePaymentStatusDTO, JobFilterDTO } from '../../application/dto/job.dto';
import { CreateJobUseCase } from '../../application/use-cases/create-job.usecase';
import { GetJobsUseCase } from '../../application/use-cases/get-jobs.usecase';
import { UpdateJobStatusUseCase } from '../../application/use-cases/update-job-status.usecase';
import { UpdatePaymentStatusUseCase } from '../../application/use-cases/update-payment-status.usecase';
import { DeleteJobUseCase } from '../../application/use-cases/delete-job.usecase';
import { JobStatus, PaymentStatus } from '../../domain/entities/job.entity';

/**
 * Controller for handling job-related HTTP requests
 */
export class JobController {
  constructor(
    private readonly createJobUseCase: CreateJobUseCase,
    private readonly getJobsUseCase: GetJobsUseCase,
    private readonly updateJobStatusUseCase: UpdateJobStatusUseCase,
    private readonly updatePaymentStatusUseCase: UpdatePaymentStatusUseCase,
    private readonly deleteJobUseCase: DeleteJobUseCase
  ) {}

  /**
   * Creates a new job
   * POST /api/jobs
   */
  async createJob(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const createJobDTO: CreateJobDTO = {
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
    } catch (error) {
      console.error('Create job error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error while creating job'
      });
    }
  }

  /**
   * Gets a specific job by ID
   * GET /api/jobs/:id
   */
  async getJob(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Get job error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error while fetching job';
      const statusCode = errorMessage.includes('Access denied') ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        message: errorMessage
      });
    }
  }

  /**
   * Gets jobs for the authenticated user
   * GET /api/jobs
   */
  async getJobs(req: AuthRequest, res: Response): Promise<void> {
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

      // Build filter from query parameters
      const filterDTO: JobFilterDTO = new JobFilterDTO(
        req.query.status as JobStatus | undefined,
        req.query.paymentStatus as PaymentStatus | undefined,
        req.query.search as string | undefined,
        req.query.dateFrom as string | undefined,
        req.query.dateTo as string | undefined,
        req.query.role as 'sender' | 'receiver' | undefined,
        req.query.limit ? parseInt(req.query.limit as string) : undefined,
        req.query.offset ? parseInt(req.query.offset as string) : undefined,
        req.query.sortBy as 'createdAt' | 'amount' | 'title' | undefined,
        req.query.sortOrder as 'asc' | 'desc' | undefined
      );

      // Determine role filter
      const roleFilter = req.query.role as "sender" | "receiver" | undefined;
      
      // If role is specified, use execute, otherwise get all jobs
      let jobs: JobDTO[];
      if (roleFilter) {
        jobs = await this.getJobsUseCase.execute(userId, roleFilter, filterDTO);
      } else {
        const allJobs = await this.getJobsUseCase.getAllUserJobs(userId, filterDTO);
        jobs = allJobs.allJobs;
      }

      res.status(200).json({
        success: true,
        data: jobs,
        total: jobs.length
      });
    } catch (error) {
      console.error('Get jobs error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching jobs'
      });
    }
  }

  /**
   * Gets job statistics
   * GET /api/jobs/statistics
   */
  async getStatistics(req: AuthRequest, res: Response): Promise<void> {
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

      const roleFilter = req.query.role as "sender" | "receiver" | undefined;
      const statistics = await this.getJobsUseCase.getStatistics(userId, roleFilter);

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching statistics'
      });
    }
  }

  /**
   * Gets jobs needing attention
   * GET /api/jobs/attention
   */
  async getJobsNeedingAttention(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error) {
      console.error('Get jobs needing attention error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching jobs needing attention'
      });
    }
  }

  /**
   * Updates job status
   * PATCH /api/jobs/:id/status
   */
  async updateJobStatus(req: AuthRequest, res: Response): Promise<void> {
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

      const updateDTO = new UpdateJobStatusDTO(req.body.status);

      const job = await this.updateJobStatusUseCase.execute(jobId, userId, updateDTO);

      res.status(200).json({
        success: true,
        message: 'Job status updated successfully',
        data: job
      });
    } catch (error) {
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

  /**
   * Processes payment for a job
   * POST /api/jobs/:id/payment
   */
  async processPayment(req: AuthRequest, res: Response): Promise<void> {
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
      } else {
        const statusCode = result.error?.includes('not found') ? 404 : 
                          result.error?.includes('permission') ? 403 : 400;
        res.status(statusCode).json({
          success: false,
          message: result.error || 'Failed to process payment'
        });
      }
    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while processing payment'
      });
    }
  }

  /**
   * Updates payment status manually (Admin only)
   * PATCH /api/jobs/:id/payment-status
   */
  async updatePaymentStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const jobId = req.params.id;
      const newStatus = req.body.paymentStatus as PaymentStatus;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const updateDTO = { paymentStatus: newStatus };
      const job = await this.updatePaymentStatusUseCase.execute(jobId, updateDTO);
new UpdatePaymentStatusDTO(newStatus)
      res.status(200).json({
        success: true,
        message: 'Payment status updated successfully',
        data: job
      });
    } catch (error) {
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

  /**
   * Deletes a job
   * DELETE /api/jobs/:id
   */
  async deleteJob(req: AuthRequest, res: Response): Promise<void> {
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
    } catch (error) {
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

  /**
   * Batch update jobs (Admin only)
   * PATCH /api/jobs/batch
   */
  async batchUpdateJobs(req: AuthRequest, res: Response): Promise<void> {
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

      // This would require implementing a batch update use case
      // For now, return not implemented
      res.status(501).json({
        success: false,
        message: 'Batch update not implemented yet'
      });
    } catch (error) {
      console.error('Batch update error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while batch updating jobs'
      });
    }
  }
}

