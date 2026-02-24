import { JobRepository } from './infrastructure/repositories/job.repository';
import { TransactionIntegrationService } from './infrastructure/services/transaction.integration';
import { CreateJobUseCase } from './application/use-cases/create-job.usecase';
import { GetJobsUseCase } from './application/use-cases/get-jobs.usecase';
import { UpdateJobStatusUseCase } from './application/use-cases/update-job-status.usecase';
import { UpdatePaymentStatusUseCase } from './application/use-cases/update-payment-status.usecase';
import { DeleteJobUseCase } from './application/use-cases/delete-job.usecase';
import { JobController } from './presentation/controllers/job.controller';
import { createJobRoutes } from './presentation/routes/job.routes';
import { Router } from 'express';

/**
 * Job Module - Main module configuration
 * Implements Clean Architecture with dependency injection
 */
export class JobModule {
  private static instance: JobModule;
  private static isInitialized = false;

  // Infrastructure Layer
  private readonly jobRepository: JobRepository;
  private readonly transactionIntegrationService: TransactionIntegrationService;

  // Application Layer
  private readonly createJobUseCase: CreateJobUseCase;
  private readonly getJobsUseCase: GetJobsUseCase;
  private readonly updateJobStatusUseCase: UpdateJobStatusUseCase;
  private readonly updatePaymentStatusUseCase: UpdatePaymentStatusUseCase;
  private readonly deleteJobUseCase: DeleteJobUseCase;

  // Presentation Layer
  private readonly jobController: JobController;
  private readonly router: Router;

  private constructor() {
    // Infrastructure Layer - External concerns
    this.jobRepository = new JobRepository();
    this.transactionIntegrationService = new TransactionIntegrationService();

    // Application Layer - Business logic coordination
    this.createJobUseCase = new CreateJobUseCase(this.jobRepository);
    this.getJobsUseCase = new GetJobsUseCase(this.jobRepository);
    this.updateJobStatusUseCase = new UpdateJobStatusUseCase(this.jobRepository);
    this.updatePaymentStatusUseCase = new UpdatePaymentStatusUseCase(
      this.jobRepository,
      this.transactionIntegrationService
    );
    this.deleteJobUseCase = new DeleteJobUseCase(this.jobRepository);

    // Presentation Layer - HTTP interface
    this.jobController = new JobController(
      this.createJobUseCase,
      this.getJobsUseCase,
      this.updateJobStatusUseCase,
      this.updatePaymentStatusUseCase,
      this.deleteJobUseCase
    );

    // Create routes
    this.router = createJobRoutes(this.jobController);
    
    JobModule.isInitialized = true;
  }

  /**
   * Singleton pattern implementation
   */
  public static getInstance(): JobModule {
    if (!JobModule.instance) {
      JobModule.instance = new JobModule();
    }
    return JobModule.instance;
  }

  /**
   * Gets the configured router for job routes
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Gets the job controller (for testing purposes)
   */
  public getController(): JobController {
    return this.jobController;
  }

  /**
   * Gets the job repository (for testing purposes)
   */
  public getRepository(): JobRepository {
    return this.jobRepository;
  }

  /**
   * Gets the transaction integration service (for testing purposes)
   */
  public getTransactionService(): TransactionIntegrationService {
    return this.transactionIntegrationService;
  }

  /**
   * Health check for the Job module
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    checks: {
      database: boolean;
      transactionService: boolean;
    };
  }> {
    try {
      // Test database connectivity by attempting a simple query
      const dbHealthy = await this.testDatabaseConnection();
      
      // Test transaction service connectivity
      const transactionHealthy = await this.testTransactionServiceConnection();

      const allHealthy = dbHealthy && transactionHealthy;

      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks: {
          database: dbHealthy,
          transactionService: transactionHealthy
        }
      };
    } catch (error) {
      console.error('Job Module health check failed:', error);
      return {
        status: 'unhealthy',
        checks: {
          database: false,
          transactionService: false
        }
      };
    }
  }

  /**
   * Tests database connection
   */
  private async testDatabaseConnection(): Promise<boolean> {
    try {
      // Test by checking if we can query the job collection
      await this.jobRepository.getStatistics('test-user-id');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Tests transaction service connection
   */
  private async testTransactionServiceConnection(): Promise<boolean> {
    try {
      // Test transaction service with a validation call
      const validation = await this.transactionIntegrationService.validatePaymentEligibility(
        'test-user-id',
        10
      );
      return validation.eligible !== undefined; // Service responded
    } catch (error) {
      console.error('Transaction service connection test failed:', error);
      return false;
    }
  }

  /**
   * Clean shutdown of the module
   */
  public async shutdown(): Promise<void> {
    try {
      // Close any connections or cleanup resources
      console.log('Job Module shutting down gracefully...');
      
      // Reset singleton
      JobModule.isInitialized = false;
      // Note: Don't reset instance as it might be referenced elsewhere
      
      console.log('Job Module shutdown complete');
    } catch (error) {
      console.error('Error during Job Module shutdown:', error);
    }
  }

  /**
   * Module information
   */
  public getModuleInfo(): {
    name: string;
    version: string;
    initialized: boolean;
    dependencies: string[];
  } {
    return {
      name: 'JobModule',
      version: '1.0.0',
      initialized: JobModule.isInitialized,
      dependencies: [
        'mongodb',
        'express',
        'express-validator',
        'mongoose',
        'transaction-service'
      ]
    };
  }

  /**
   * Static method to initialize the module
   */
  public static async initialize(): Promise<JobModule> {
    const module = JobModule.getInstance();
    
    // Perform any async initialization if needed
    console.log('Job Module initialized successfully');
    
    return module;
  }
}

/**
 * Export the singleton instance getter as default
 */
export default JobModule;

/**
 * Export for direct router usage
 */
export const jobRouter = JobModule.getInstance().getRouter();

/**
 * Factory function for creating job module routes
 */
export function createJobModule(): Router {
  return JobModule.getInstance().getRouter();
}