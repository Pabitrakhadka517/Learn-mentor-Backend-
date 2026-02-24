import { IStudyResourceRepository, ResourceFilter } from '../../domain/interfaces/studyresource.repository.interface';
import { StudyResourceDTO } from '../dto/studyresource.dto';

/**
 * Use case for retrieving public study resources
 * Implements business logic for filtering and sorting public resources
 */
export class GetPublicResourcesUseCase {
  constructor(private readonly repository: IStudyResourceRepository) {}

  /**
   * Executes the use case to get public resources
   * @param filter Optional filter parameters
   * @returns Promise of filtered public resources
   */
  async execute(filter?: ResourceFilter): Promise<StudyResourceDTO[]> {
    try {
      // Validate filter parameters
      this.validateFilter(filter);

      // Get public resources from repository
      const resources = await this.repository.getPublicResources(filter);

      // Apply business rules for public resource display
      return resources.map(resource => {
        // Return public-safe version of DTO
        const dto = new StudyResourceDTO(
          resource.id,
          resource.title,
          resource.category,
          resource.type,
          resource.url,
          resource.size,
          resource.tutorId,
          resource.isPublic,
          resource.createdAt,
          resource.updatedAt,
          resource.tutorName,
          resource.downloadCount
        );
        return dto.toPublicDTO() as StudyResourceDTO;
      });
    } catch (error) {
      throw new Error(`Failed to retrieve public resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateFilter(filter?: ResourceFilter): void {
    if (filter) {
      if (filter.category && filter.category.trim().length === 0) {
        throw new Error('Category filter cannot be empty');
      }
      if (filter.search && filter.search.trim().length < 2) {
        throw new Error('Search term must be at least 2 characters');
      }
    }
  }
}