import { Router } from 'express';
import { StudyController } from './study.controller';
import { authenticate, authorizeRoles } from '../auth/auth.middleware';
import { uploadStudyResource } from './study.middleware';

const router = Router();

/**
 * Public routes
 */
router.get('/', StudyController.getResources);

/**
 * Protected routes
 */
router.get('/my', authenticate, authorizeRoles('TUTOR', 'ADMIN'), StudyController.getMyResources);
router.post('/upload', authenticate, authorizeRoles('TUTOR', 'ADMIN'), uploadStudyResource, StudyController.upload);
router.delete('/:id', authenticate, authorizeRoles('TUTOR', 'ADMIN'), StudyController.delete);

export default router;
