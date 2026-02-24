import { IStudyResourceRepository } from '../../domain/interfaces/studyresource.repository.interface';
import { StudyResourceDTO } from '../dto/studyresource.dto';
import { Types } from 'mongoose';

/**
 * Use case for retrieving a tutor's own study resources
 * Implements business logic for tutor resource management
 */
export class GetMyResourcesUseCase {
  constructor(private readonly repository: IStudyResourceRepository) {}

  /**
   * Executes the use case to get tutor's resources
   * @param tutorId The tutor's unique identifier
   * @returns Promise of tutor's resources with full details
   */
  async execute(tutorId: string): Promise<StudyResourceDTO[]> {
    try {
      // Validate tutor ID
      this.validateTutorId(tutorId);

      // Get tutor's resources from repository
      const resources = await this.repository.getMyResources(tutorId);

      // Return full DTOs for resource owner
      return resources.map(resource => resource.toTutorDTO());
    } catch (error) {
      throw new Error(`Failed to retrieve tutor resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets resource statistics for the tutor
   * @param tutorId The tutor's unique identifier
   * @returns Promise of resource statistics
   */
  async getStatistics(tutorId: string): Promise<{
    totalResources: number;
    publicResources: number;
    privateResources: number;
    resourcesByType: Record<string, number>;
  }> {
    try {
      this.validateTutorId(tutorId);
      return await this.repository.getResourceStatistics(tutorId);
    } catch (error) {
      throw new Error(`Failed to retrieve resource statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateTutorId(tutorId: string): void {
    if (!tutorId || tutorId.trim().length === 0) {
      throw new Error('Tutor ID is required');
    }

    // Validate ObjectId format if using MongoDB
    try {
      new Types.ObjectId(tutorId);
    } catch {
      throw new Error('Invalid tutor ID format');
    }
  }
}