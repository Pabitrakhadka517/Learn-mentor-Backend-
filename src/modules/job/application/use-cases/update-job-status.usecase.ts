import { IJobRepository } from '../../domain/interfaces/job.repository.interface';
import { JobDTO, UpdateJobStatusDTO } from '../dto/job.dto';
import { JobStatus } from '../../domain/entities/job.entity';
import { Types } from 'mongoose';

/**
 * Use case for updating job status
 * Implements business logic for status transitions with validation
 */
export class UpdateJobStatusUseCase {
  constructor(private readonly repository: IJobRepository) {}

  /**
   * Executes the use case to update job status
   * @param jobId The job ID to update
   * @param userId The user ID making the update
   * @param updateStatusData The status update data
   * @returns Promise of the updated job DTO
   */
  async execute(
    jobId: string, 
    userId: string, 
    updateStatusData: UpdateJobStatusDTO
  ): Promise<JobDTO> {
    try {
      // Validate inputs
      this.validateJobId(jobId);
      this.validateUserId(userId);
      this.validateUpdateStatusData(updateStatusData);

      // Get the current job entity
      const currentJob = await this.repository.findEntityById(jobId);
      if (!currentJob) {
        throw new Error('Job not found');
      }

      // Check if user has permission to update this job status
      const canUpdate = currentJob.canUpdateStatus(new Types.ObjectId(userId));
      if (!canUpdate.isValid) {
        throw new Error(canUpdate.error!);
      }

      // Update the job status using entity business logic
      const updatedEntity = currentJob.updateStatus(updateStatusData.status);

      // Save the updated entity
      const updatedJob = await this.repository.updateJob(updatedEntity);

      return updatedJob;
    } catch (error) {
      throw new Error(`Failed to update job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch updates multiple job statuses
   * @param jobIds Array of job IDs to update
   * @param userId The user ID making the updates
   * @param newStatus The new status to apply
   * @returns Promise with update results
   */
  async batchUpdateStatus(
    jobIds: string[], 
    userId: string, 
    newStatus: JobStatus
  ): Promise<{ updated: string[]; failed: Array<{ id: string; error: string }> }> {
    const results = {
      updated: [] as string[],
      failed: [] as Array<{ id: string; error: string }>
    };

    for (const jobId of jobIds) {
      try {
        await this.execute(jobId, userId, new UpdateJobStatusDTO(newStatus));
        results.updated.push(jobId);
      } catch (error) {
        results.failed.push({
          id: jobId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Gets valid status transitions for a job
   * @param jobId The job ID
   * @param userId The user ID
   * @returns Promise of valid next statuses
   */
  async getValidTransitions(jobId: string, userId: string): Promise<JobStatus[]> {
    try {
      this.validateJobId(jobId);
      this.validateUserId(userId);

      const job = await this.repository.findEntityById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Check access
      const canUpdate = job.canUpdateStatus(new Types.ObjectId(userId));
      if (!canUpdate.isValid) {
        return []; // No valid transitions if user can't update
      }

      // Return valid transitions based on current status
      const validTransitions: Record<JobStatus, JobStatus[]> = {
        'pending': ['active', 'cancelled'],
        'active': ['finished', 'cancelled'],
        'finished': [], // Terminal state
        'cancelled': [] // Terminal state
      };

      return validTransitions[job.status] || [];
    } catch (error) {
      throw new Error(`Failed to get valid transitions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auto-transitions jobs based on business rules
   * For example, auto-cancel jobs that are pending for too long
   * @returns Promise with auto-transition results
   */
  async autoTransitionJobs(): Promise<{ transitioned: number; errors: string[] }> {
    try {
      // This could be called by a scheduled job
      // Implementation depends on specific business rules
      // For now, returning empty results
      return { transitioned: 0, errors: [] };
    } catch (error) {
      throw new Error(`Auto-transition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  private validateUpdateStatusData(data: UpdateJobStatusDTO): void {
    const validStatuses: JobStatus[] = ['pending', 'active', 'finished', 'cancelled'];
    
    if (!data.status || !validStatuses.includes(data.status)) {
      throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
    }
  }
}