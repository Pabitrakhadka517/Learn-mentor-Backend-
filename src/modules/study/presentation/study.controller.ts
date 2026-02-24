import { Request, Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { GetPublicResourcesUseCase } from '../application/use-cases/get-public-resources.usecase';
import { GetMyResourcesUseCase } from '../application/use-cases/get-my-resources.usecase';
import { UploadResourceUseCase } from '../application/use-cases/upload-resource.usecase';
import { DeleteResourceUseCase } from '../application/use-cases/delete-resource.usecase';
import { CreateStudyResourceDTO, StudyResourceFilterDTO } from '../application/dto/studyresource.dto';
import { ResourceFilter } from '../domain/interfaces/studyresource.repository.interface';

/**
 * Study Resources Controller
 * Handles HTTP requests and delegates business logic to use cases
 * Contains no business logic - only HTTP concerns
 */
export class StudyController {
  constructor(
    private readonly getPublicResourcesUseCase: GetPublicResourcesUseCase,
    private readonly getMyResourcesUseCase: GetMyResourcesUseCase,
    private readonly uploadResourceUseCase: UploadResourceUseCase,
    private readonly deleteResourceUseCase: DeleteResourceUseCase
  ) {}

  /**
   * GET /api/study
   * Retrieves public study resources with optional filtering
   */
  async getPublicResources(req: Request, res: Response): Promise<void> {
    try {
      const { category, type, search } = req.query;
      
      const filter: ResourceFilter = {};
      if (category && typeof category === 'string') filter.category = category;
      if (type && typeof type === 'string') filter.type = type;
      if (search && typeof search === 'string') filter.search = search;

      const resources = await this.getPublicResourcesUseCase.execute(filter);
      
      res.status(200).json({
        success: true,
        message: 'Public resources retrieved successfully',
        data: {
          resources,
          count: resources.length
        }
      });
    } catch (error) {
      console.error('Error getting public resources:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve public resources'
      });
    }
  }

  /**
   * GET /api/study/my
   * Retrieves tutor's own study resources
   */
  async getMyResources(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { userId, role } = req.user;
      
      // Only tutors and admins can access this endpoint
      if (role !== 'TUTOR' && role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only tutors and admins can access this resource'
        });
        return;
      }

      const resources = await this.getMyResourcesUseCase.execute(userId);
      const statistics = await this.getMyResourcesUseCase.getStatistics(userId);
      
      res.status(200).json({
        success: true,
        message: 'Your resources retrieved successfully',
        data: {
          resources,
          statistics,
          count: resources.length
        }
      });
    } catch (error) {
      console.error('Error getting tutor resources:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retrieve your resources'
      });
    }
  }

  /**
   * POST /api/study/upload
   * Uploads a new study resource
   */
  async uploadResource(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { userId, role } = req.user;
      
      // Only tutors and admins can upload resources
      if (role !== 'TUTOR' && role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only tutors and admins can upload resources'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'File is required'
        });
        return;
      }

      const { title, category, isPublic } = req.body;

      // Validate required fields
      if (!title || typeof title !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Title is required and must be a string'
        });
        return;
      }

      // Parse isPublic boolean
      const isResourcePublic = isPublic === 'true' || isPublic === true;

      const createResourceDTO = new CreateStudyResourceDTO(
        title.trim(),
        category?.trim() || null,
        isResourcePublic,
        req.file
      );

      const resource = await this.uploadResourceUseCase.execute(userId, createResourceDTO);
      
      res.status(201).json({
        success: true,
        message: 'Resource uploaded successfully',
        data: {
          resource
        }
      });
    } catch (error) {
      console.error('Error uploading resource:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload resource'
      });
    }
  }

  /**
   * DELETE /api/study/:id
   * Deletes a study resource
   */
  async deleteResource(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { userId, role } = req.user;
      const { id } = req.params;

      // Only tutors and admins can delete resources
      if (role !== 'TUTOR' && role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only tutors and admins can delete resources'
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Resource ID is required'
        });
        return;
      }

      await this.deleteResourceUseCase.execute(id, userId);
      
      res.status(200).json({
        success: true,
        message: 'Resource deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            message: error.message
          });
          return;
        }
        if (error.message.includes('Unauthorized')) {
          res.status(403).json({
            success: false,
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete resource'
      });
    }
  }

  /**
   * POST /api/study/batch-delete
   * Batch delete multiple resources
   */
  async batchDeleteResources(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { userId, role } = req.user;
      const { resourceIds } = req.body;

      // Only tutors and admins can delete resources
      if (role !== 'TUTOR' && role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only tutors and admins can delete resources'
        });
        return;
      }

      if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Resource IDs array is required'
        });
        return;
      }

      const results = await this.deleteResourceUseCase.batchDelete(resourceIds, userId);
      
      res.status(200).json({
        success: true,
        message: 'Batch deletion completed',
        data: {
          deleted: results.deleted,
          failed: results.failed,
          summary: {
            totalRequested: resourceIds.length,
            successfulDeletions: results.deleted.length,
            failedDeletions: results.failed.length
          }
        }
      });
    } catch (error) {
      console.error('Error batch deleting resources:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to batch delete resources'
      });
    }
  }
}