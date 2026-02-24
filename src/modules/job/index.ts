// Job Module - Clean Architecture Implementation
// Exports for the Job/Task Management Module

// Main Module
export { jobRouter, createJobModule } from './job.module';
import JobModule from './job.module';

// Domain Layer
export { JobEntity, JobStatus, PaymentStatus } from './domain/entities/job.entity';
export { IJobRepository, JobFilter, JobStatistics } from './domain/interfaces/job.repository.interface';

// Application Layer
export {
  JobDTO,
  CreateJobDTO,
  UpdateJobStatusDTO,
  JobStatisticsDTO
} from './application/dto/job.dto';

export { CreateJobUseCase } from './application/use-cases/create-job.usecase';
export { GetJobsUseCase } from './application/use-cases/get-jobs.usecase';
export { UpdateJobStatusUseCase } from './application/use-cases/update-job-status.usecase';
export { UpdatePaymentStatusUseCase } from './application/use-cases/update-payment-status.usecase';
export { DeleteJobUseCase } from './application/use-cases/delete-job.usecase';

// Infrastructure Layer
export { JobRepository } from './infrastructure/repositories/job.repository';
export { TransactionIntegrationService } from './infrastructure/services/transaction.integration';

// Presentation Layer
export { JobController } from './presentation/controllers/job.controller';
export { createJobRoutes } from './presentation/routes/job.routes';
export {
  validateJobCreation,
  validateJobStatusUpdate,
  validatePaymentStatusUpdate,
  validateBatchUpdate,
  validateJobQuery
} from './presentation/middleware/job.validation';

// Database Models
export { Job, IJob } from './job.model';

// Default export - Main module instance
export default JobModule;