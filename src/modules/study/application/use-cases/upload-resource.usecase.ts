import { IStudyResourceRepository } from '../../domain/interfaces/studyresource.repository.interface';
import { StudyResourceEntity, ResourceType } from '../../domain/entities/studyresource.entity';
import { StudyResourceDTO, CreateStudyResourceDTO } from '../dto/studyresource.dto';
import { Types } from 'mongoose';

export interface CloudinaryUploadResult {
  secure_url: string;
  bytes: number;
  public_id: string;
}

export interface ICloudinaryService {
  uploadFile(file: Express.Multer.File): Promise<CloudinaryUploadResult>;
  deleteFile(publicId: string): Promise<void>;
}

/**
 * Use case for uploading new study resources
 * Implements business logic for file validation, upload, and resource creation
 */
export class UploadResourceUseCase {
  constructor(
    private readonly repository: IStudyResourceRepository,
    private readonly cloudinaryService: ICloudinaryService
  ) {}

  /**
   * Executes the use case to upload a new resource
   * @param tutorId The tutor's unique identifier
   * @param createResourceData The resource creation data
   * @returns Promise of the created resource DTO
   */
  async execute(tutorId: string, createResourceData: CreateStudyResourceDTO): Promise<StudyResourceDTO> {
    try {
      // Validate inputs
      this.validateTutorId(tutorId);
      this.validateCreateResourceData(createResourceData);
      
      // Validate file
      this.validateFile(createResourceData.file);

      // Upload file to Cloudinary
      const uploadResult = await this.uploadFile(createResourceData.file);

      // Create entity
      const resourceEntity = StudyResourceEntity.create(
        createResourceData.title,
        createResourceData.category,
        uploadResult.secure_url,
        createResourceData.file.mimetype,
        uploadResult.bytes,
        new Types.ObjectId(tutorId),
        createResourceData.isPublic
      );

      // Save to repository
      const savedResource = await this.repository.uploadResource(resourceEntity);

      return savedResource;
    } catch (error) {
      // Clean up uploaded file if entity creation or saving fails
      // This will be handled by the error handling middleware
      throw new Error(`Failed to upload resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async uploadFile(file: Express.Multer.File): Promise<CloudinaryUploadResult> {
    try {
      return await this.cloudinaryService.uploadFile(file);
    } catch (error) {
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  private validateCreateResourceData(data: CreateStudyResourceDTO): void {
    if (!data.title || data.title.trim().length < 2 || data.title.trim().length > 200) {
      throw new Error('Title must be between 2 and 200 characters');
    }

    if (data.category && data.category.trim().length > 100) {
      throw new Error('Category must be less than 100 characters');
    }

    if (typeof data.isPublic !== 'boolean') {
      throw new Error('isPublic must be a boolean value');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error('File is required');
    }

    // Validate file type
    const fileTypeValidation = StudyResourceEntity.validateFileType(file.mimetype);
    if (!fileTypeValidation.isValid) {
      throw new Error(fileTypeValidation.error!);
    }

    // Validate file size
    const resourceType = StudyResourceEntity.determineResourceType(file.mimetype);
    const fileSizeValidation = StudyResourceEntity.validateFileSize(file.size, resourceType);
    if (!fileSizeValidation.isValid) {
      throw new Error(fileSizeValidation.error!);
    }
  }
}