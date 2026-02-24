import { Router } from 'express';

// Domain
import { IStudyResourceRepository } from './domain/interfaces/studyresource.repository.interface';

// Application
import { GetPublicResourcesUseCase } from './application/use-cases/get-public-resources.usecase';
import { GetMyResourcesUseCase } from './application/use-cases/get-my-resources.usecase';
import { UploadResourceUseCase, ICloudinaryService } from './application/use-cases/upload-resource.usecase';
import { DeleteResourceUseCase } from './application/use-cases/delete-resource.usecase';

// Infrastructure
import { StudyResourceRepository } from './infrastructure/repositories/studyresource.repository';
import { CloudinaryService } from './infrastructure/cloudinary/cloudinary.service';

// Presentation
import { StudyController } from './presentation/study.controller';
import { createStudyRoutes } from './presentation/study.routes';

/**
 * Study Module
 * Implements Clean Architecture with dependency injection
 * Assembles all layers and provides the configured router
 */
export class StudyModule {
  private repository!: IStudyResourceRepository;
  private cloudinaryService!: ICloudinaryService;
  private getPublicResourcesUseCase!: GetPublicResourcesUseCase;
  private getMyResourcesUseCase!: GetMyResourcesUseCase;
  private uploadResourceUseCase!: UploadResourceUseCase;
  private deleteResourceUseCase!: DeleteResourceUseCase;
  private controller!: StudyController;
  private router: Router;

  constructor() {
    this.initializeDependencies();
    this.router = this.createRouter();
  }

  private initializeDependencies(): void {
    // Infrastructure layer
    this.repository = new StudyResourceRepository();
    this.cloudinaryService = new CloudinaryService();

    // Application layer (Use Cases)
    this.getPublicResourcesUseCase = new GetPublicResourcesUseCase(this.repository);
    this.getMyResourcesUseCase = new GetMyResourcesUseCase(this.repository);
    this.uploadResourceUseCase = new UploadResourceUseCase(this.repository, this.cloudinaryService);
    this.deleteResourceUseCase = new DeleteResourceUseCase(this.repository, this.cloudinaryService);

    // Presentation layer
    this.controller = new StudyController(
      this.getPublicResourcesUseCase,
      this.getMyResourcesUseCase,
      this.uploadResourceUseCase,
      this.deleteResourceUseCase
    );
  }

  private createRouter(): Router {
    return createStudyRoutes(this.controller);
  }

  /**
   * Get the configured router for the study module
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Get the repository instance (for testing or external access)
   */
  getRepository(): IStudyResourceRepository {
    return this.repository;
  }

  /**
   * Get the Cloudinary service instance (for testing or external access)
   */
  getCloudinaryService(): ICloudinaryService {
    return this.cloudinaryService;
  }

  /**
   * Get the controller instance (for testing)
   */
  getController(): StudyController {
    return this.controller;
  }

  /**
   * Health check for the study module
   * Verifies that all dependencies are properly initialized
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    dependencies: {
      repository: boolean;
      cloudinaryService: boolean;
      useCases: boolean;
      controller: boolean;
    };
    timestamp: Date;
  }> {
    try {
      const dependencies = {
        repository: !!this.repository,
        cloudinaryService: !!this.cloudinaryService,
        useCases: !!(this.getPublicResourcesUseCase && 
                    this.getMyResourcesUseCase && 
                    this.uploadResourceUseCase && 
                    this.deleteResourceUseCase),
        controller: !!this.controller
      };

      const allHealthy = Object.values(dependencies).every(dep => dep);

      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        dependencies,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        dependencies: {
          repository: false,
          cloudinaryService: false,
          useCases: false,
          controller: false
        },
        timestamp: new Date()
      };
    }
  }
}

/**
 * Factory function to create and configure the study module
 */
export const createStudyModule = (): StudyModule => {
  return new StudyModule();
};

/**
 * Export types for external use
 */
export type { IStudyResourceRepository } from './domain/interfaces/studyresource.repository.interface';
export type { StudyResourceDTO } from './application/dto/studyresource.dto';
export type { StudyResourceEntity, ResourceType } from './domain/entities/studyresource.entity';
export { StudyController } from './presentation/study.controller';
export { studyRoutesDocs } from './presentation/study.routes';