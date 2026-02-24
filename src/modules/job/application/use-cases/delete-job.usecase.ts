import { IJobRepository } from '../../domain/interfaces/job.repository.interface';
import { Types } from 'mongoose';

/**
 * Use case for deleting jobs
 * Implements business logic for safe job deletion with validation
 */
export class DeleteJobUseCase {
  constructor(private readonly repository: IJobRepository) {}

  /**
   * Executes the use case to delete a job
   * @param jobId The job ID to delete
   * @param userId The user ID requesting deletion
   * @returns Promise that resolves when deletion is complete
   */
  async execute(jobId: string, userId: string): Promise<void> {
    try {
      // Validate inputs
      this.validateJobId(jobId);
      this.validateUserId(userId);

      // Get the current job entity
      const currentJob = await this.repository.findEntityById(jobId);
      if (!currentJob) {
        throw new Error('Job not found');
      }

      // Check if user can delete this job
      const canDelete = currentJob.canBeDeletedBy(new Types.ObjectId(userId));
      if (!canDelete.isValid) {
        throw new Error(canDelete.error!);
      }

      // Delete the job
      await this.repository.delete(jobId, userId);
    } catch (error) {
      throw new Error(`Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Soft delete a job (mark as cancelled instead of permanent deletion)
   * @param jobId The job ID to soft delete
   * @param userId The user ID requesting deletion
   * @returns Promise that resolves when soft deletion is complete
   */
  async softDelete(jobId: string, userId: string): Promise<void> {
    try {
      this.validateJobId(jobId);
      this.validateUserId(userId);

      const currentJob = await this.repository.findEntityById(jobId);
      if (!currentJob) {
        throw new Error('Job not found');
      }

      // Check ownership
      if (currentJob.senderId.toString() !== userId) {
        throw new Error('Only job creator can cancel the job');
      }

      // Check if job can be cancelled
      if (currentJob.status === 'finished' || currentJob.paymentStatus === 'done') {
        throw new Error('Cannot cancel completed jobs or jobs with completed payments');
      }

      // Update status to cancelled
      const updatedEntity = currentJob.updateStatus('cancelled');
      await this.repository.updateJob(updatedEntity);
    } catch (error) {
      throw new Error(`Failed to cancel job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch delete multiple jobs
   * @param jobIds Array of job IDs to delete
   * @param userId The user ID requesting deletions
   * @returns Promise with deletion results
   */
  async batchDelete(jobIds: string[], userId: string): Promise<{
    deleted: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const results = {
      deleted: [] as string[],
      failed: [] as Array<{ id: string; error: string }>
    };

    for (const jobId of jobIds) {
      try {
        await this.execute(jobId, userId);
        results.deleted.push(jobId);
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
   * Batch soft delete (cancel) multiple jobs
   * @param jobIds Array of job IDs to cancel
   * @param userId The user ID requesting cancellations
   * @returns Promise with cancellation results
   */
  async batchSoftDelete(jobIds: string[], userId: string): Promise<{
    cancelled: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const results = {
      cancelled: [] as string[],
      failed: [] as Array<{ id: string; error: string }>
    };

    for (const jobId of jobIds) {
      try {
        await this.softDelete(jobId, userId);
        results.cancelled.push(jobId);
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
   * Checks if a job can be deleted
   * @param jobId The job ID to check
   * @param userId The user ID
   * @returns Promise indicating if job can be deleted and why
   */
  async canDelete(jobId: string, userId: string): Promise<{
    canDelete: boolean;
    reason?: string;
  }> {
    try {
      this.validateJobId(jobId);
      this.validateUserId(userId);

      const job = await this.repository.findEntityById(jobId);
      if (!job) {
        return { canDelete: false, reason: 'Job not found' };
      }

      const canDeleteResult = job.canBeDeletedBy(new Types.ObjectId(userId));
      return {
        canDelete: canDeleteResult.isValid,
        reason: canDeleteResult.error
      };
    } catch (error) {
      return {
        canDelete: false,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets delete options for a job (soft delete vs hard delete)
   * @param jobId The job ID
   * @param userId The user ID
   * @returns Promise with available delete options
   */
  async getDeleteOptions(jobId: string, userId: string): Promise<{
    canHardDelete: boolean;
    canSoftDelete: boolean;
    restrictions: string[];
  }> {
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

      const restrictions: string[] = [];
      const canDeleteResult = job.canBeDeletedBy(new Types.ObjectId(userId));
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
    } catch (error) {
      return {
        canHardDelete: false,
        canSoftDelete: false,
        restrictions: [error instanceof Error ? error.message : 'Unknown error']
      };
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
}