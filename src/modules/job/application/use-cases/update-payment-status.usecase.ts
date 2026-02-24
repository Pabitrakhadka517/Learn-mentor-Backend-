import { IJobRepository } from '../../domain/interfaces/job.repository.interface';
import { JobDTO, UpdatePaymentStatusDTO } from '../dto/job.dto';
import { PaymentStatus } from '../../domain/entities/job.entity';
import { Types } from 'mongoose';

export interface ITransactionIntegrationService {
  processPayment(jobId: string, amount: number, senderId: string, receiverId: string): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }>;
  refundPayment(transactionId: string): Promise<boolean>;
  getPaymentStatus(transactionId: string): Promise<PaymentStatus>;
}

/**
 * Use case for updating job payment status
 * Implements business logic for payment processing with Transaction module integration
 */
export class UpdatePaymentStatusUseCase {
  constructor(
    private readonly repository: IJobRepository,
    private readonly transactionService?: ITransactionIntegrationService
  ) {}

  /**
   * Executes the use case to update payment status
   * @param jobId The job ID to update
   * @param updatePaymentData The payment update data
   * @returns Promise of the updated job DTO
   */
  async execute(
    jobId: string, 
    updatePaymentData: UpdatePaymentStatusDTO
  ): Promise<JobDTO> {
    try {
      // Validate inputs
      this.validateJobId(jobId);
      this.validateUpdatePaymentData(updatePaymentData);

      // Get the current job entity
      const currentJob = await this.repository.findEntityById(jobId);
      if (!currentJob) {
        throw new Error('Job not found');
      }

      // Update payment status using entity business logic
      const updatedEntity = currentJob.updatePaymentStatus(updatePaymentData.paymentStatus);

      // If payment is being marked as 'done', process through transaction service
      if (updatePaymentData.paymentStatus === 'done' && this.transactionService) {
        await this.processPaymentThroughTransactionService(currentJob.id!.toString(), currentJob);
      }

      // Save the updated entity
      const updatedJob = await this.repository.updateJob(updatedEntity);

      return updatedJob;
    } catch (error) {
      throw new Error(`Failed to update payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Processes payment for a job
   * @param jobId The job ID
   * @param senderId The sender (payer) ID
   * @returns Promise of payment processing result
   */
  async processJobPayment(jobId: string, senderId: string): Promise<{
    success: boolean;
    jobDTO?: JobDTO;
    transactionId?: string;
    error?: string;
  }> {
    try {
      this.validateJobId(jobId);
      this.validateUserId(senderId);

      const job = await this.repository.findEntityById(jobId);
      if (!job) {
        return { success: false, error: 'Job not found' };
      }

      // Validate that the sender is the job creator
      if (job.senderId.toString() !== senderId) {
        return { success: false, error: 'Only job creator can process payment' };
      }

      // Check if payment can be processed
      if (job.paymentStatus !== 'pending') {
        return { success: false, error: `Payment is already ${job.paymentStatus}` };
      }

      if (!this.transactionService) {
        return { success: false, error: 'Transaction service not available' };
      }

      // Process payment through transaction service
      const paymentResult = await this.transactionService.processPayment(
        jobId,
        job.amount,
        job.senderId.toString(),
        job.receiverId.toString()
      );

      let updatedJob: JobDTO;

      if (paymentResult.success) {
        // Update job payment status to 'done'
        const updatedEntity = job.updatePaymentStatus('done');
        updatedJob = await this.repository.updateJob(updatedEntity);
      } else {
        // Update job payment status to 'failed'
        const updatedEntity = job.updatePaymentStatus('failed');
        updatedJob = await this.repository.updateJob(updatedEntity);
      }

      return {
        success: paymentResult.success,
        jobDTO: updatedJob,
        transactionId: paymentResult.transactionId,
        error: paymentResult.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Refunds payment for a job
   * @param jobId The job ID
   * @param transactionId The transaction ID to refund
   * @param userId The user ID requesting refund
   * @returns Promise of refund result
   */
  async refundJobPayment(
    jobId: string, 
    transactionId: string, 
    userId: string
  ): Promise<{ success: boolean; jobDTO?: JobDTO; error?: string }> {
    try {
      this.validateJobId(jobId);
      this.validateUserId(userId);

      const job = await this.repository.findEntityById(jobId);
      if (!job) {
        return { success: false, error: 'Job not found' };
      }

      // Only sender can request refund
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
        // Update payment status to pending (or create a new status for refunded)
        const updatedEntity = job.updatePaymentStatus('pending');
        const updatedJob = await this.repository.updateJob(updatedEntity);
        
        return { success: true, jobDTO: updatedJob };
      } else {
        return { success: false, error: 'Refund processing failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets valid payment status transitions for a job
   * @param jobId The job ID
   * @returns Promise of valid payment statuses
   */
  async getValidPaymentTransitions(jobId: string): Promise<PaymentStatus[]> {
    try {
      this.validateJobId(jobId);

      const job = await this.repository.findEntityById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
        'pending': ['done', 'failed'],
        'done': [], // Terminal state (or could allow refund to pending)
        'failed': ['pending', 'done'] // Can retry
      };

      return validTransitions[job.paymentStatus] || [];
    } catch (error) {
      throw new Error(`Failed to get valid payment transitions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processPaymentThroughTransactionService(
    jobId: string, 
    job: any
  ): Promise<void> {
    if (!this.transactionService) {
      return; // Skip if no transaction service
    }

    try {
      const paymentResult = await this.transactionService.processPayment(
        jobId,
        job.amount,
        job.senderId.toString(),
        job.receiverId.toString()
      );

      if (!paymentResult.success) {
        // If transaction service fails, we might want to revert the payment status
        // This depends on business requirements
        console.warn(`Transaction service failed for job ${jobId}:`, paymentResult.error);
      }
    } catch (error) {
      console.error(`Error processing payment through transaction service:`, error);
      // Handle transaction service errors according to business requirements
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

  private validateUpdatePaymentData(data: UpdatePaymentStatusDTO): void {
    const validPaymentStatuses: PaymentStatus[] = ['pending', 'done', 'failed'];
    
    if (!data.paymentStatus || !validPaymentStatuses.includes(data.paymentStatus)) {
      throw new Error(`Payment status must be one of: ${validPaymentStatuses.join(', ')}`);
    }
  }
}