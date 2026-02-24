import { JobStatus, PaymentStatus } from '../../domain/entities/job.entity';

/**
 * Data Transfer Object for Job entities
 * Used for API responses and inter-layer communication
 */
export class JobDTO {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly senderId: string,
    public readonly receiverId: string,
    public readonly amount: number,
    public readonly status: JobStatus,
    public readonly paymentStatus: PaymentStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly senderName?: string,
    public readonly receiverName?: string,
    public readonly senderEmail?: string,
    public readonly receiverEmail?: string
  ) {}

  /**
   * Creates a safe version of the DTO for response to sender
   */
  toSenderDTO(): Partial<JobDTO> {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      receiverId: this.receiverId,
      receiverName: this.receiverName,
      amount: this.amount,
      status: this.status,
      paymentStatus: this.paymentStatus,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Creates a safe version of the DTO for response to receiver
   */
  toReceiverDTO(): Partial<JobDTO> {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      senderId: this.senderId,
      senderName: this.senderName,
      amount: this.amount,
      status: this.status,
      paymentStatus: this.paymentStatus,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Creates a minimal DTO for list views
   */
  toMinimalDTO(): Partial<JobDTO> {
    return {
      id: this.id,
      title: this.title,
      amount: this.amount,
      status: this.status,
      paymentStatus: this.paymentStatus,
      createdAt: this.createdAt
    };
  }

  /**
   * Creates a full DTO with all details (for admin or full access)
   */
  toFullDTO(): JobDTO {
    return this;
  }
}

/**
 * DTO for creating new jobs
 */
export class CreateJobDTO {
  constructor(
    public readonly title: string,
    public readonly description: string | null,
    public readonly receiverId: string,
    public readonly amount: number
  ) {}
}

/**
 * DTO for updating job status
 */
export class UpdateJobStatusDTO {
  constructor(
    public readonly status: JobStatus
  ) {}
}

/**
 * DTO for updating payment status
 */
export class UpdatePaymentStatusDTO {
  constructor(
    public readonly paymentStatus: PaymentStatus,
    public readonly transactionId?: string,
    public readonly paymentReference?: string
  ) {}
}

/**
 * DTO for filtering jobs
 */
export class JobFilterDTO {
  constructor(
    public readonly status?: JobStatus,
    public readonly paymentStatus?: PaymentStatus,
    public readonly search?: string,
    public readonly dateFrom?: string,
    public readonly dateTo?: string,
    public readonly role?: 'sender' | 'receiver',
    public readonly limit?: number,
    public readonly offset?: number,
    public readonly sortBy?: 'createdAt' | 'amount' | 'title',
    public readonly sortOrder?: 'asc' | 'desc'
  ) {}
}

/**
 * DTO for job statistics
 */
export class JobStatisticsDTO {
  constructor(
    public readonly totalJobs: number,
    public readonly activeJobs: number,
    public readonly completedJobs: number,
    public readonly cancelledJobs: number,
    public readonly totalEarnings: number,
    public readonly totalSpent: number,
    public readonly pendingPayments: number,
    public readonly jobsByStatus: Record<JobStatus, number>,
    public readonly jobsByPaymentStatus: Record<PaymentStatus, number>,
    public readonly averageJobValue: number,
    public readonly completionRate: number
  ) {}
}

/**
 * DTO for batch operations
 */
export class BatchJobOperationDTO {
  constructor(
    public readonly jobIds: string[],
    public readonly operation: 'updateStatus' | 'updatePaymentStatus' | 'delete',
    public readonly newStatus?: JobStatus,
    public readonly newPaymentStatus?: PaymentStatus
  ) {}
}

/**
 * DTO for job notifications
 */
export class JobNotificationDTO {
  constructor(
    public readonly jobId: string,
    public readonly type: 'status_update' | 'payment_update' | 'job_created' | 'job_deleted',
    public readonly message: string,
    public readonly recipientId: string,
    public readonly metadata?: Record<string, any>
  ) {}
}