import { StudyResourceEntity } from '../entities/studyresource.entity';
import { StudyResourceDTO } from '../../application/dto/studyresource.dto';

export interface ResourceFilter {
  category?: string;
  type?: string;
  search?: string;
}

export interface IStudyResourceRepository {
  /**
   * Retrieves all public resources with optional filtering
   * @param filter Optional filter parameters
   * @returns Promise of filtered public resources
   */
  getPublicResources(filter?: ResourceFilter): Promise<StudyResourceDTO[]>;

  /**
   * Retrieves all resources owned by a specific tutor
   * @param tutorId The tutor's unique identifier
   * @returns Promise of tutor's resources
   */
  getMyResources(tutorId: string): Promise<StudyResourceDTO[]>;

  /**
   * Uploads and saves a new study resource
   * @param resource The study resource entity to save
   * @returns Promise of the saved resource DTO
   */
  uploadResource(resource: StudyResourceEntity): Promise<StudyResourceDTO>;

  /**
   * Deletes a resource by ID, ensuring ownership verification
   * @param resourceId The resource ID to delete
   * @param tutorId The tutor ID for ownership verification
   * @returns Promise that resolves when deletion is complete
   * @throws Error if resource not found or tutor doesn't own the resource
   */
  deleteResource(resourceId: string, tutorId: string): Promise<void>;

  /**
   * Finds a resource by ID
   * @param resourceId The resource ID to find
   * @returns Promise of the resource entity or null if not found
   */
  findById(resourceId: string): Promise<StudyResourceEntity | null>;

  /**
   * Updates an existing resource
   * @param resourceId The resource ID to update
   * @param updateData Partial update data
   * @param tutorId The tutor ID for ownership verification
   * @returns Promise of the updated resource DTO
   */
  updateResource(
    resourceId: string, 
    updateData: Partial<StudyResourceEntity>, 
    tutorId: string
  ): Promise<StudyResourceDTO>;

  /**
   * Checks if a resource exists and is owned by the specified tutor
   * @param resourceId The resource ID to check
   * @param tutorId The tutor ID to verify ownership
   * @returns Promise of boolean indicating ownership
   */
  verifyOwnership(resourceId: string, tutorId: string): Promise<boolean>;

  /**
   * Gets aggregate statistics for resources
   * @param tutorId Optional tutor ID for tutor-specific stats
   * @returns Promise of resource statistics
   */
  getResourceStatistics(tutorId?: string): Promise<{
    totalResources: number;
    publicResources: number;
    privateResources: number;
    resourcesByType: Record<string, number>;
  }>;
}