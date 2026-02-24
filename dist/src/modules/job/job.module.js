"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobRouter = exports.JobModule = void 0;
exports.createJobModule = createJobModule;
const job_repository_1 = require("./infrastructure/repositories/job.repository");
const transaction_integration_1 = require("./infrastructure/services/transaction.integration");
const create_job_usecase_1 = require("./application/use-cases/create-job.usecase");
const get_jobs_usecase_1 = require("./application/use-cases/get-jobs.usecase");
const update_job_status_usecase_1 = require("./application/use-cases/update-job-status.usecase");
const update_payment_status_usecase_1 = require("./application/use-cases/update-payment-status.usecase");
const delete_job_usecase_1 = require("./application/use-cases/delete-job.usecase");
const job_controller_1 = require("./presentation/controllers/job.controller");
const job_routes_1 = require("./presentation/routes/job.routes");
class JobModule {
    constructor() {
        this.jobRepository = new job_repository_1.JobRepository();
        this.transactionIntegrationService = new transaction_integration_1.TransactionIntegrationService();
        this.createJobUseCase = new create_job_usecase_1.CreateJobUseCase(this.jobRepository);
        this.getJobsUseCase = new get_jobs_usecase_1.GetJobsUseCase(this.jobRepository);
        this.updateJobStatusUseCase = new update_job_status_usecase_1.UpdateJobStatusUseCase(this.jobRepository);
        this.updatePaymentStatusUseCase = new update_payment_status_usecase_1.UpdatePaymentStatusUseCase(this.jobRepository, this.transactionIntegrationService);
        this.deleteJobUseCase = new delete_job_usecase_1.DeleteJobUseCase(this.jobRepository);
        this.jobController = new job_controller_1.JobController(this.createJobUseCase, this.getJobsUseCase, this.updateJobStatusUseCase, this.updatePaymentStatusUseCase, this.deleteJobUseCase);
        this.router = (0, job_routes_1.createJobRoutes)(this.jobController);
        JobModule.isInitialized = true;
    }
    static getInstance() {
        if (!JobModule.instance) {
            JobModule.instance = new JobModule();
        }
        return JobModule.instance;
    }
    getRouter() {
        return this.router;
    }
    getController() {
        return this.jobController;
    }
    getRepository() {
        return this.jobRepository;
    }
    getTransactionService() {
        return this.transactionIntegrationService;
    }
    async healthCheck() {
        try {
            const dbHealthy = await this.testDatabaseConnection();
            const transactionHealthy = await this.testTransactionServiceConnection();
            const allHealthy = dbHealthy && transactionHealthy;
            return {
                status: allHealthy ? 'healthy' : 'unhealthy',
                checks: {
                    database: dbHealthy,
                    transactionService: transactionHealthy
                }
            };
        }
        catch (error) {
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
    async testDatabaseConnection() {
        try {
            await this.jobRepository.getStatistics('test-user-id');
            return true;
        }
        catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    }
    async testTransactionServiceConnection() {
        try {
            const validation = await this.transactionIntegrationService.validatePaymentEligibility('test-user-id', 10);
            return validation.eligible !== undefined;
        }
        catch (error) {
            console.error('Transaction service connection test failed:', error);
            return false;
        }
    }
    async shutdown() {
        try {
            console.log('Job Module shutting down gracefully...');
            JobModule.isInitialized = false;
            console.log('Job Module shutdown complete');
        }
        catch (error) {
            console.error('Error during Job Module shutdown:', error);
        }
    }
    getModuleInfo() {
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
    static async initialize() {
        const module = JobModule.getInstance();
        console.log('Job Module initialized successfully');
        return module;
    }
}
exports.JobModule = JobModule;
JobModule.isInitialized = false;
exports.default = JobModule;
exports.jobRouter = JobModule.getInstance().getRouter();
function createJobModule() {
    return JobModule.getInstance().getRouter();
}
//# sourceMappingURL=job.module.js.map