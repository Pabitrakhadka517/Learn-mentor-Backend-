import { ResourceType } from '../../domain/entities/studyresource.entity';

/**
 * Data Transfer Object for Study Resources
 * Used for API responses and inter-layer communication
 */
export class StudyResourceDTO {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly category: string | null,
    public readonly type: ResourceType,
    public readonly url: string,
    public readonly size: string,
    public readonly tutorId: string,
    public readonly isPublic: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly tutorName?: string, // Optional tutor name for display purposes
    public readonly downloadCount?: number // Optional download tracking
  ) {}

  /**
   * Creates a public-safe version of the DTO for public resource listings
   * Excludes sensitive tutor information for students accessing public resources
   */
  toPublicDTO(): Partial<StudyResourceDTO> {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      type: this.type,
      url: this.url,
      size: this.size,
      createdAt: this.createdAt,
      tutorName: this.tutorName,
      downloadCount: this.downloadCount
    };
  }

  /**
   * Creates a tutor-specific version of the DTO with full details
   * Includes all information for resource owners
   */
  toTutorDTO(): StudyResourceDTO {
    return this;
  }

  /**
   * Creates a minimal DTO for lists and previews
   */
  toMinimalDTO(): Partial<StudyResourceDTO> {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      type: this.type,
      size: this.size,
      isPublic: this.isPublic,
      createdAt: this.createdAt
    };
  }
}

/**
 * DTO for creating new study resources
 */
export class CreateStudyResourceDTO {
  constructor(
    public readonly title: string,
    public readonly category: string | null,
    public readonly isPublic: boolean,
    public readonly file: Express.Multer.File
  ) {}
}

/**
 * DTO for updating existing study resources
 */
export class UpdateStudyResourceDTO {
  constructor(
    public readonly title?: string,
    public readonly category?: string,
    public readonly isPublic?: boolean
  ) {}
}

/**
 * DTO for filtering study resources
 */
export class StudyResourceFilterDTO {
  constructor(
    public readonly category?: string,
    public readonly type?: ResourceType,
    public readonly search?: string,
    public readonly isPublic?: boolean,
    public readonly tutorId?: string,
    public readonly limit?: number,
    public readonly offset?: number,
    public readonly sortBy?: 'createdAt' | 'title' | 'size',
    public readonly sortOrder?: 'asc' | 'desc'
  ) {}
}

/**
 * DTO for resource statistics
 */
export class ResourceStatisticsDTO {
  constructor(
    public readonly totalResources: number,
    public readonly publicResources: number,
    public readonly privateResources: number,
    public readonly resourcesByType: Record<string, number>,
    public readonly resourcesByCategory: Record<string, number>,
    public readonly totalSize: string,
    public readonly averageSize: string
  ) {}
}