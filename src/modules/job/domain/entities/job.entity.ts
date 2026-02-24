import { Types } from 'mongoose';

type ObjectId = Types.ObjectId;
import { JobDTO } from '../../application/dto/job.dto';

export type JobStatus = 'pending' | 'active' | 'finished' | 'cancelled';
export type PaymentStatus = 'pending' | 'done' | 'failed';

export interface JobValidationResult {
  isValid: boolean;
  error?: string;
}

export class JobEntity {
  constructor(
    public readonly title: string,
    public readonly description: string | null,
    public readonly senderId: ObjectId,
    public readonly receiverId: ObjectId,
    public readonly amount: number,
    public readonly status: JobStatus = 'pending',
    public readonly paymentStatus: PaymentStatus = 'pending',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly id?: ObjectId
  ) {
    this.validateTitle(title);
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    this.validateUserIds(senderId, receiverId);
  }

  /**
   * Validates the job title
   */
  private validateTitle(title: string): void {
    if (!title || title.trim().length < 2 || title.trim().length > 200) {
      throw new Error('Title must be between 2 and 200 characters');
    }
  }

  /**
   * Validates the job amount
   */
  validateAmount(): JobValidationResult {
    if (this.amount <= 0) {
      return {
        isValid: false,
        error: 'Amount must be greater than 0'
      };
    }
    return { isValid: true };
  }

  /**
   * Validates that sender and receiver are different users
   */
  private validateUserIds(senderId: ObjectId, receiverId: ObjectId): void {
    if (!senderId || !receiverId) {
      throw new Error('Sender and receiver IDs are required');
    }
    if (senderId.toString() === receiverId.toString()) {
      throw new Error('Sender and receiver cannot be the same user');
    }
  }

  /**
   * Validates the job description length
   */
  private static validateDescription(description: string): JobValidationResult {
    if (description && description.length > 2000) {
      return {
        isValid: false,
        error: 'Description cannot exceed 2000 characters'
      };
    }
    return { isValid: true };
  }

  /**
   * Updates the job status with validation for allowed transitions
   */
  updateStatus(newStatus: JobStatus): JobEntity {
    const validTransition = this.validateStatusTransition(newStatus);
    if (!validTransition.isValid) {
      throw new Error(validTransition.error!);
    }

    return new JobEntity(
      this.title,
      this.description,
      this.senderId,
      this.receiverId,
      this.amount,
      newStatus,
      this.paymentStatus,
      this.createdAt,
      new Date(),
      this.id
    );
  }

  /**
   * Updates the payment status
   */
  updatePaymentStatus(newPaymentStatus: PaymentStatus): JobEntity {
    const validTransition = this.validatePaymentStatusTransition(newPaymentStatus);
    if (!validTransition.isValid) {
      throw new Error(validTransition.error!);
    }

    return new JobEntity(
      this.title,
      this.description,
      this.senderId,
      this.receiverId,
      this.amount,
      this.status,
      newPaymentStatus,
      this.createdAt,
      new Date(),
      this.id
    );
  }

  /**
   * Validates status transitions according to business rules
   */
  private validateStatusTransition(newStatus: JobStatus): JobValidationResult {
    const allowedTransitions: Record<JobStatus, JobStatus[]> = {
      'pending': ['active', 'cancelled'],
      'active': ['finished', 'cancelled'],
      'finished': [], // Terminal state
      'cancelled': [] // Terminal state
    };

    const allowed = allowedTransitions[this.status];
    if (!allowed.includes(newStatus)) {
      return {
        isValid: false,
        error: `Cannot transition from ${this.status} to ${newStatus}`
      };
    }

    return { isValid: true };
  }

  /**
   * Validates payment status transitions
   */
  private validatePaymentStatusTransition(newPaymentStatus: PaymentStatus): JobValidationResult {
    const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      'pending': ['done', 'failed'],
      'done': [], // Terminal state
      'failed': ['pending', 'done'] // Can retry failed payments
    };

    const allowed = allowedTransitions[this.paymentStatus];
    if (!allowed.includes(newPaymentStatus)) {
      return {
        isValid: false,
        error: `Cannot transition payment status from ${this.paymentStatus} to ${newPaymentStatus}`
      };
    }

    return { isValid: true };
  }

  /**
   * Checks if job can be deleted
   */
  canBeDeleted(): JobValidationResult {
    if (this.status === 'active' || this.paymentStatus === 'done') {
      return {
        isValid: false,
        error: 'Cannot delete active jobs or jobs with completed payments'
      };
    }
    return { isValid: true };
  }

  /**
   * Checks if job status can be updated by a specific user
   */
  canUpdateStatus(userId: ObjectId): JobValidationResult {
    const userIdStr = userId.toString();
    const senderIdStr = this.senderId.toString();
    const receiverIdStr = this.receiverId.toString();

    if (userIdStr !== senderIdStr && userIdStr !== receiverIdStr) {
      return {
        isValid: false,
        error: 'Only job participants can update status'
      };
    }

    return { isValid: true };
  }

  /**
   * Checks if job can be deleted by a specific user
   */
  canBeDeletedBy(userId: ObjectId): JobValidationResult {
    if (userId.toString() !== this.senderId.toString()) {
      return {
        isValid: false,
        error: 'Only the job creator can delete the job'
      };
    }

    return this.canBeDeleted();
  }

  /**
   * Creates a new JobEntity from creation data
   */
  static create(
    title: string,
    description: string | null,
    senderId: ObjectId,
    receiverId: ObjectId,
    amount: number
  ): JobEntity {
    // Validate description if provided
    if (description) {
      const descValidation = this.validateDescription(description);
      if (!descValidation.isValid) {
        throw new Error(descValidation.error!);
      }
    }

    return new JobEntity(
      title.trim(),
      description?.trim() || null,
      senderId,
      receiverId,
      amount
    );
  }

  /**
   * Converts entity to DTO for API responses
   */
  mapToDTO(): JobDTO {
    return new JobDTO(
      this.id?.toString() || '',
      this.title,
      this.description,
      this.senderId.toString(),
      this.receiverId.toString(),
      this.amount,
      this.status,
      this.paymentStatus,
      this.createdAt,
      this.updatedAt
    );
  }

  /**
   * Checks if the job is in a terminal state
   */
  isTerminal(): boolean {
    return this.status === 'finished' || this.status === 'cancelled';
  }

  /**
   * Calculates the time since job creation
   */
  getAgeInHours(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.createdAt.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }
}