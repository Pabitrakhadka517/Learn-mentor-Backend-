import { IStudyResourceRepository } from '../../domain/interfaces/studyresource.repository.interface';
import { Types } from 'mongoose';

export interface ICloudinaryService {
  deleteFile(publicId: string): Promise<void>;
}

/**
 * Use case for deleting study resources
 * Implements business logic for ownership verification and resource cleanup
 */
export class DeleteResourceUseCase {
  constructor(
    private readonly repository: IStudyResourceRepository,
    private readonly cloudinaryService: ICloudinaryService
  ) {}

  /**
   * Executes the use case to delete a resource
   * @param resourceId The resource ID to delete
   * @param tutorId The tutor ID for ownership verification
   * @returns Promise that resolves when deletion is complete
   */
  async execute(resourceId: string, tutorId: string): Promise<void> {
    try {
      // Validate inputs
      this.validateResourceId(resourceId);
      this.validateTutorId(tutorId);

      // Verify ownership before deletion
      const resource = await this.repository.findById(resourceId);
      if (!resource) {
        throw new Error('Resource not found');
      }

      if (resource.tutorId.toString() !== tutorId) {
        throw new Error('Unauthorized: You can only delete your own resources');
      }

      // Extract Cloudinary public ID from URL
      const publicId = this.extractPublicIdFromUrl(resource.url);

      // Delete from repository first (to maintain data consistency)
      await this.repository.deleteResource(resourceId, tutorId);

      // Then delete from Cloudinary (non-critical failure)
      try {
        await this.cloudinaryService.deleteFile(publicId);
      } catch (cloudinaryError) {
        // Log the error but don't fail the operation
        console.warn(`Failed to delete file from Cloudinary: ${publicId}`, cloudinaryError);
        // In a production environment, this could be queued for retry
      }
    } catch (error) {
      throw new Error(`Failed to delete resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch delete multiple resources (admin function)
   * @param resourceIds Array of resource IDs to delete
   * @param tutorId The tutor ID for ownership verification
   * @returns Promise with deletion results
   */
  async batchDelete(resourceIds: string[], tutorId: string): Promise<{
    deleted: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const results = {
      deleted: [] as string[],
      failed: [] as Array<{ id: string; error: string }>
    };

    for (const resourceId of resourceIds) {
      try {
        await this.execute(resourceId, tutorId);
        results.deleted.push(resourceId);
      } catch (error) {
        results.failed.push({
          id: resourceId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private validateResourceId(resourceId: string): void {
    if (!resourceId || resourceId.trim().length === 0) {
      throw new Error('Resource ID is required');
    }

    try {
      new Types.ObjectId(resourceId);
    } catch {
      throw new Error('Invalid resource ID format');
    }
  }

  private validateTutorId(tutorId: string): void {
    if (!tutorId || tutorId.trim().length === 0) {
      throw new Error('Tutor ID is required');
    }

    try {
      new Types.ObjectId(tutorId);
    } catch {
      throw new Error('Invalid tutor ID format');
    }
  }

  private extractPublicIdFromUrl(cloudinaryUrl: string): string {
    // Extract public ID from Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    try {
      const urlParts = cloudinaryUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = filename.split('.')[0];
      
      // Include the folder structure if present
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
        // Skip version (v1234567890) and get the path
        const pathParts = urlParts.slice(uploadIndex + 2, -1);
        return pathParts.length > 0 ? `${pathParts.join('/')}/${publicId}` : publicId;
      }
      
      return publicId;
    } catch (error) {
      console.warn(`Failed to extract public ID from URL: ${cloudinaryUrl}`, error);
      return '';
    }
  }
}