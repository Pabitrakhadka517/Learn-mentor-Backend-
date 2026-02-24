import { Router, Response } from 'express';
import { JobController } from '../controllers/job.controller';
import { authenticate, authorizeRoles, AuthRequest } from '../../../auth/auth.middleware';
import { validateJobCreation, validateJobStatusUpdate, validatePaymentStatusUpdate } from '../middleware/job.validation';

/**
 * Router factory for job-related routes
 */
export function createJobRoutes(jobController: JobController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticate);

  /**
   * @route GET /api/jobs
   * @desc Get jobs for the authenticated user
   * @access Student, Tutor, Admin
   * @query {
   *   status?: JobStatus,
   *   paymentStatus?: PaymentStatus,
   *   role?: 'sender' | 'receiver',
   *   search?: string,
   *   dateFrom?: string (ISO date),
   *   dateTo?: string (ISO date)
   * }
   */
  router.get(
    '/',
    authorizeRoles('STUDENT', 'TUTOR', 'ADMIN'),
    (req: AuthRequest, res: Response) => jobController.getJobs(req, res)
  );

  /**
   * @route GET /api/jobs/statistics
   * @desc Get job statistics for the authenticated user
   * @access Student, Tutor, Admin
   * @query {
   *   role?: 'sender' | 'receiver'
   * }
   */
  router.get(
    '/statistics',
    authorizeRoles('STUDENT', 'TUTOR', 'ADMIN'),
    (req: AuthRequest, res: Response) => jobController.getStatistics(req, res)
  );

  /**
   * @route GET /api/jobs/attention
   * @desc Get jobs that need attention
   * @access Student, Tutor, Admin
   */
  router.get(
    '/attention',
    authorizeRoles('STUDENT', 'TUTOR', 'ADMIN'),
    (req: AuthRequest, res: Response) => jobController.getJobsNeedingAttention(req, res)
  );

  /**
   * @route GET /api/jobs/:id
   * @desc Get a specific job by ID
   * @access Student, Tutor, Admin (must have access to the job)
   */
  router.get(
    '/:id',
    authorizeRoles('STUDENT', 'TUTOR', 'ADMIN'),
    (req: AuthRequest, res: Response) => jobController.getJob(req, res)
  );

  /**
   * @route POST /api/jobs
   * @desc Create a new job
   * @access Student, Tutor
   * @body {
   *   title: string,
   *   description?: string,
   *   receiverId: string,
   *   amount: number
   * }
   */
  router.post(
    '/',
    authorizeRoles('STUDENT', 'TUTOR'),
    validateJobCreation,
    (req: AuthRequest, res: Response) => jobController.createJob(req, res)
  );

  /**
   * @route PATCH /api/jobs/:id/status
   * @desc Update job status
   * @access Student, Tutor, Admin
   * @body {
   *   status: JobStatus
   * }
   */
  router.patch(
    '/:id/status',
    authorizeRoles('STUDENT', 'TUTOR', 'ADMIN'),
    validateJobStatusUpdate,
    (req: AuthRequest, res: Response) => jobController.updateJobStatus(req, res)
  );

  /**
   * @route POST /api/jobs/:id/payment
   * @desc Process payment for a job
   * @access Student (sender only)
   */
  router.post(
    '/:id/payment',
    authorizeRoles('STUDENT', 'TUTOR'),
    (req: AuthRequest, res: Response) => jobController.processPayment(req, res)
  );

  /**
   * @route PATCH /api/jobs/:id/payment-status
   * @desc Update payment status manually (Admin only)
   * @access Admin
   * @body {
   *   paymentStatus: PaymentStatus
   * }
   */
  router.patch(
    '/:id/payment-status',
    authorizeRoles('ADMIN'),
    validatePaymentStatusUpdate,
    (req: AuthRequest, res: Response) => jobController.updatePaymentStatus(req, res)
  );

  /**
   * @route DELETE /api/jobs/:id
   * @desc Delete a job
   * @access Student (sender), Admin
   * @query {
   *   force?: boolean (Admin only)
   * }
   */
  router.delete(
    '/:id',
    authorizeRoles('STUDENT', 'TUTOR', 'ADMIN'),
    (req: AuthRequest, res: Response) => jobController.deleteJob(req, res)
  );

  /**
   * @route PATCH /api/jobs/batch
   * @desc Batch update jobs (Admin only)
   * @access Admin
   * @body {
   *   jobIds: string[],
   *   updateData: Partial<{ status: JobStatus; paymentStatus: PaymentStatus }>
   * }
   */
  router.patch(
    '/batch',
    authorizeRoles('ADMIN'),
    (req: AuthRequest, res: Response) => jobController.batchUpdateJobs(req, res)
  );

  return router;
}

/**
 * Default export for direct usage
 */
export default createJobRoutes;
