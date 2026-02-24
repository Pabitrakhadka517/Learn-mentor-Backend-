import { Types } from 'mongoose';
import { StudyResourceDTO } from '../../application/dto/studyresource.dto';

type ObjectId = Types.ObjectId;

export enum ResourceType {
  PDF = 'PDF',
  MODULE = 'MODULE',
  OTHER = 'OTHER'
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export class StudyResourceEntity {
  constructor(
    public readonly title: string,
    public readonly category: string | null,
    public readonly type: ResourceType,
    public readonly url: string,
    public readonly size: string,
    public readonly tutorId: ObjectId,
    public readonly isPublic: boolean,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly id?: ObjectId
  ) {
    this.validateTitle(title);
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length < 2 || title.trim().length > 200) {
      throw new Error('Title must be between 2 and 200 characters');
    }
  }

  /**
   * Validates file type based on MIME type
   */
  static validateFileType(mimeType: string): FileValidationResult {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      return {
        isValid: false,
        error: `File type ${mimeType} is not supported. Allowed types: PDF, DOC, DOCX, TXT, PPT, PPTX, JPG, PNG, GIF`
      };
    }

    return { isValid: true };
  }

  /**
   * Validates file size based on resource type
   */
  static validateFileSize(sizeInBytes: number, resourceType: ResourceType): FileValidationResult {
    const maxSizeInMB = resourceType === ResourceType.PDF ? 10 : 5; // 10MB for PDFs, 5MB for others
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (sizeInBytes > maxSizeInBytes) {
      return {
        isValid: false,
        error: `File size exceeds ${maxSizeInMB}MB limit for ${resourceType} files`
      };
    }

    return { isValid: true };
  }

  /**
   * Converts bytes to human-readable format
   */
  static calculateSize(sizeInBytes: number): string {
    if (sizeInBytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));

    return parseFloat((sizeInBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Determines resource type based on MIME type
   */
  static determineResourceType(mimeType: string): ResourceType {
    if (mimeType === 'application/pdf') {
      return ResourceType.PDF;
    } else if (
      mimeType.includes('word') || 
      mimeType.includes('powerpoint') || 
      mimeType === 'text/plain'
    ) {
      return ResourceType.MODULE;
    } else {
      return ResourceType.OTHER;
    }
  }

  /**
   * Creates a new StudyResourceEntity from upload data
   */
  static create(
    title: string,
    category: string | null,
    url: string,
    mimeType: string,
    sizeInBytes: number,
    tutorId: ObjectId,
    isPublic: boolean
  ): StudyResourceEntity {
    const resourceType = this.determineResourceType(mimeType);
    const size = this.calculateSize(sizeInBytes);

    return new StudyResourceEntity(
      title.trim(),
      category?.trim() || null,
      resourceType,
      url,
      size,
      tutorId,
      isPublic
    );
  }

  /**
   * Converts entity to DTO for API responses
   */
  mapToDTO(): StudyResourceDTO {
    return new StudyResourceDTO(
      this.id?.toString() || '',
      this.title,
      this.category,
      this.type,
      this.url,
      this.size,
      this.tutorId.toString(),
      this.isPublic,
      this.createdAt,
      this.updatedAt
    );
  }

  /**
   * Updates the entity with new data
   */
  update(title?: string, category?: string, isPublic?: boolean): StudyResourceEntity {
    const updatedTitle = title?.trim() || this.title;
    const updatedCategory = category?.trim() || this.category;
    const updatedIsPublic = isPublic !== undefined ? isPublic : this.isPublic;

    if (title) {
      this.validateTitle(updatedTitle);
    }

    return new StudyResourceEntity(
      updatedTitle,
      updatedCategory,
      this.type,
      this.url,
      this.size,
      this.tutorId,
      updatedIsPublic,
      this.createdAt,
      new Date(),
      this.id
    );
  }
}