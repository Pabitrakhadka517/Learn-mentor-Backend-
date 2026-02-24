import { IJobRepository, JobFilter } from '../../domain/interfaces/job.repository.interface';
import { JobDTO, JobFilterDTO, JobStatisticsDTO } from '../dto/job.dto';
import { Types } from 'mongoose';

/**
 * Use case for retrieving jobs
 * Implements business logic for job querying with filtering and role-based access
 */
export class GetJobsUseCase {
  constructor(private readonly repository: IJobRepository) {}

  /**
   * Gets jobs by user role (sender or receiver)
   * @param userId The user ID
   * @param role The user's role in the jobs
   * @param filterDTO Optional filter parameters
   * @returns Promise of filtered job DTOs
   */
  async execute(
    userId: string, 
    role: "sender" | "receiver", 
    filterDTO?: JobFilterDTO
  ): Promise<JobDTO[]> {
    try {
      this.validateUserId(userId);
      this.validateRole(role);

      // Convert DTO filter to domain filter
      const filter = this.convertFilterDTOToFilter(filterDTO);

      // Get jobs from repository
      const jobs = await this.repository.getByUser(userId, role, filter);

      // Sort jobs by creation date (newest first) if not specified
      return this.sortJobs(jobs, filterDTO?.sortBy, filterDTO?.sortOrder);
    } catch (error) {
      throw new Error(`Failed to retrieve jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets all jobs for a user (both sent and received)
   * @param userId The user ID
   * @param filterDTO Optional filter parameters
   * @returns Promise of all user's job DTOs
   */
  async getAllUserJobs(userId: string, filterDTO?: JobFilterDTO): Promise<{
    sentJobs: JobDTO[];
    receivedJobs: JobDTO[];
    allJobs: JobDTO[];
  }> {
    try {
      this.validateUserId(userId);

      const filter = this.convertFilterDTOToFilter(filterDTO);
      
      const [sentJobs, receivedJobs] = await Promise.all([
        this.repository.getByUser(userId, 'sender', filter),
        this.repository.getByUser(userId, 'receiver', filter)
      ]);

      // Combine and sort all jobs
      const allJobs = [...sentJobs, ...receivedJobs];
      const sortedAllJobs = this.sortJobs(allJobs, filterDTO?.sortBy, filterDTO?.sortOrder);

      return {
        sentJobs: this.sortJobs(sentJobs, filterDTO?.sortBy, filterDTO?.sortOrder),
        receivedJobs: this.sortJobs(receivedJobs, filterDTO?.sortBy, filterDTO?.sortOrder),
        allJobs: sortedAllJobs
      };
    } catch (error) {
      throw new Error(`Failed to retrieve all user jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets a specific job by ID with access control
   * @param jobId The job ID
   * @param userId The user ID requesting the job
   * @returns Promise of job DTO or null if not found/no access
   */
  async getJobById(jobId: string, userId: string): Promise<JobDTO | null> {
    try {
      this.validateUserId(userId);
      this.validateJobId(jobId);

      // Check if user has access to this job
      const hasAccess = await this.repository.hasAccess(jobId, userId);
      if (!hasAccess) {
        throw new Error('Access denied: You can only view jobs you are involved in');
      }

      return await this.repository.getById(jobId);
    } catch (error) {
      throw new Error(`Failed to retrieve job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets job statistics for a user
   * @param userId The user ID
   * @param role Optional role filter
   * @returns Promise of job statistics
   */
  async getStatistics(userId: string, role?: "sender" | "receiver"): Promise<JobStatisticsDTO> {
    try {
      this.validateUserId(userId);
      if (role) {
        this.validateRole(role);
      }

      const stats = await this.repository.getStatistics(userId, role);

      // Calculate additional metrics
      const averageJobValue = stats.totalJobs > 0 ? stats.totalEarnings / stats.totalJobs : 0;
      const completionRate = stats.totalJobs > 0 ? (stats.completedJobs / stats.totalJobs) * 100 : 0;

      return new JobStatisticsDTO(
        stats.totalJobs,
        stats.activeJobs,
        stats.completedJobs,
        stats.cancelledJobs,
        stats.totalEarnings,
        stats.totalEarnings, // For now, using same value. Could calculate spent separately
        stats.pendingPayments,
        stats.jobsByStatus,
        stats.jobsByPaymentStatus,
        averageJobValue,
        completionRate
      );
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets jobs that need attention from the user
   * @param userId The user ID
   * @returns Promise of jobs needing attention
   */
  async getJobsNeedingAttention(userId: string): Promise<JobDTO[]> {
    try {
      this.validateUserId(userId);
      return await this.repository.getJobsNeedingAttention(userId);
    } catch (error) {
      throw new Error(`Failed to get jobs needing attention: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    try {
      new Types.ObjectId(userId);
    } catch {
      throw new Error('Invalid user ID format');
    }
  }

  private validateRole(role: string): void {
    if (!['sender', 'receiver'].includes(role)) {
      throw new Error('Role must be either "sender" or "receiver"');
    }
  }

  private validateJobId(jobId: string): void {
    if (!jobId || jobId.trim().length === 0) {
      throw new Error('Job ID is required');
    }

    try {
      new Types.ObjectId(jobId);
    } catch {
      throw new Error('Invalid job ID format');
    }
  }

  private convertFilterDTOToFilter(filterDTO?: JobFilterDTO): JobFilter | undefined {
    if (!filterDTO) return undefined;

    const filter: JobFilter = {};
    
    if (filterDTO.status) filter.status = filterDTO.status;
    if (filterDTO.paymentStatus) filter.paymentStatus = filterDTO.paymentStatus;
    if (filterDTO.search) filter.search = filterDTO.search;
    if (filterDTO.dateFrom) filter.dateFrom = new Date(filterDTO.dateFrom);
    if (filterDTO.dateTo) filter.dateTo = new Date(filterDTO.dateTo);

    return filter;
  }

  private sortJobs(jobs: JobDTO[], sortBy?: string, sortOrder?: string): JobDTO[] {
    if (!sortBy) {
      // Default sort by creation date, newest first
      return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const order = sortOrder === 'asc' ? 1 : -1;

    return jobs.sort((a, b) => {
      let aValue: any;
      let bValue: any;

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

      if (aValue < bValue) return -order;
      if (aValue > bValue) return order;
      return 0;
    });
  }
}