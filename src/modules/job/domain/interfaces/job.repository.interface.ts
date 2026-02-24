import { JobEntity, JobStatus, PaymentStatus } from '../entities/job.entity';
import { JobDTO } from '../../application/dto/job.dto';

export interface JobFilter {
  status?: JobStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface JobStatistics {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  totalEarnings: number;
  pendingPayments: number;
  jobsByStatus: Record<JobStatus, number>;
  jobsByPaymentStatus: Record<PaymentStatus, number>;
}

export interface IJobRepository {
  /**
   * Creates a new job
   * @param job The job entity to create
   * @returns Promise of the created job DTO
   */
  create(job: JobEntity): Promise<JobDTO>;

  /**
   * Finds a job by ID
   * @param jobId The job ID to find
   * @returns Promise of the job DTO or null if not found
   */
  getById(jobId: string): Promise<JobDTO | null>;

  /**
   * Gets jobs by user role (sender or receiver)
   * @param userId The user ID
   * @param role Whether user is sender or receiver
   * @param filter Optional filter parameters
   * @returns Promise of job DTOs
   */
  getByUser(
    userId: string, 
    role: "sender" | "receiver", 
    filter?: JobFilter
  ): Promise<JobDTO[]>;

  /**
   * Gets all jobs for a user (both sent and received)
   * @param userId The user ID
   * @param filter Optional filter parameters
   * @returns Promise of job DTOs
   */
  getAllUserJobs(userId: string, filter?: JobFilter): Promise<JobDTO[]>;

  /**
   * Updates job status
   * @param jobId The job ID to update
   * @param status The new status
   * @returns Promise of the updated job DTO
   */
  updateStatus(jobId: string, status: JobStatus): Promise<JobDTO>;

  /**
   * Updates payment status
   * @param jobId The job ID to update
   * @param paymentStatus The new payment status
   * @returns Promise of the updated job DTO
   */
  updatePaymentStatus(jobId: string, paymentStatus: PaymentStatus): Promise<JobDTO>;

  /**
   * Deletes a job
   * @param jobId The job ID to delete
   * @param userId The user ID for ownership verification
   * @returns Promise that resolves when deletion is complete
   */
  delete(jobId: string, userId: string): Promise<void>;

  /**
   * Finds a job entity by ID
   * @param jobId The job ID to find
   * @returns Promise of the job entity or null if not found
   */
  findEntityById(jobId: string): Promise<JobEntity | null>;

  /**
   * Updates a job entity
   * @param job The job entity to update
   * @returns Promise of the updated job DTO
   */
  updateJob(job: JobEntity): Promise<JobDTO>;

  /**
   * Checks if a user has permission to access a job
   * @param jobId The job ID
   * @param userId The user ID
   * @returns Promise of boolean indicating access permission
   */
  hasAccess(jobId: string, userId: string): Promise<boolean>;

  /**
   * Gets job statistics for a user
   * @param userId The user ID
   * @param role Optional role filter (sender, receiver)
   * @returns Promise of job statistics
   */
  getStatistics(userId: string, role?: "sender" | "receiver"): Promise<JobStatistics>;

  /**
   * Batch updates multiple jobs
   * @param jobIds Array of job IDs to update
   * @param updateData Partial update data
   * @returns Promise of update results
   */
  batchUpdate(
    jobIds: string[], 
    updateData: Partial<{ status: JobStatus; paymentStatus: PaymentStatus }>
  ): Promise<{ updated: string[]; failed: string[] }>;

  /**
   * Gets jobs that need attention (overdue, payment pending, etc.)
   * @param userId The user ID
   * @returns Promise of jobs requiring attention
   */
  getJobsNeedingAttention(userId: string): Promise<JobDTO[]>;
}