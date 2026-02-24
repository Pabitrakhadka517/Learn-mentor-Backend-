import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ICloudinaryService, CloudinaryUploadResult } from '../../application/use-cases/upload-resource.usecase';
import { Readable } from 'stream';

/**
 * Cloudinary service implementation for file uploads and management
 * Handles secure file uploads to Cloudinary with optimization
 */
export class CloudinaryService implements ICloudinaryService {
  private readonly folderPath = 'learnmentor/resources';

  constructor() {
    this.configureCloudinary();
  }

  private configureCloudinary(): void {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }

  /**
   * Uploads a file to Cloudinary
   * @param file The multer file object
   * @returns Promise of upload result with secure URL and metadata
   */
  async uploadFile(file: Express.Multer.File): Promise<CloudinaryUploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Create upload options based on file type
      const uploadOptions = this.getUploadOptions(file);

      // Convert buffer to stream for Cloudinary
      const uploadResult = await this.uploadStream(file.buffer, uploadOptions);

      return {
        secure_url: uploadResult.secure_url,
        bytes: uploadResult.bytes,
        public_id: uploadResult.public_id
      };
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes a file from Cloudinary
   * @param publicId The public ID of the file to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      if (!publicId) {
        throw new Error('Public ID is required for deletion');
      }

      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Failed to delete file: ${result.result}`);
      }
    } catch (error) {
      throw new Error(`Cloudinary deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Uploads file buffer as stream to Cloudinary
   */
  private uploadStream(buffer: Buffer, options: any): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        }
      );

      // Convert buffer to readable stream and pipe to Cloudinary
      const readable = new Readable({
        read() {
          this.push(buffer);
          this.push(null); // End the stream
        }
      });

      readable.pipe(stream);
    });
  }

  /**
   * Gets upload options based on file type and content
   */
  private getUploadOptions(file: Express.Multer.File): any {
    const baseOptions = {
      folder: this.folderPath,
      unique_filename: true,
      use_filename: true,
      overwrite: false,
      resource_type: 'auto' as const
    };

    // Specific options for different file types
    if (file.mimetype === 'application/pdf') {
      return {
        ...baseOptions,
        resource_type: 'image' as const, // PDFs are handled as images in Cloudinary
        format: 'pdf'
      };
    }

    if (file.mimetype.startsWith('image/')) {
      return {
        ...baseOptions,
        resource_type: 'image' as const,
        transformation: [
          {
            quality: 'auto:good',
            fetch_format: 'auto'
          },
          {
            width: 1200,
            height: 1200,
            crop: 'limit'
          }
        ]
      };
    }

    // For documents and other files
    return {
      ...baseOptions,
      resource_type: 'raw' as const
    };
  }

  /**
   * Validates file before upload
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.buffer) {
      throw new Error('File buffer is empty');
    }

    if (file.size === 0) {
      throw new Error('File is empty');
    }

    // Additional validation can be added here
  }

  /**
   * Gets file information from Cloudinary
   * @param publicId The public ID of the file
   * @returns Promise of file information
   */
  async getFileInfo(publicId: string): Promise<any> {
    try {
      return await cloudinary.api.resource(publicId);
    } catch (error) {
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates a signed URL for temporary access
   * @param publicId The public ID of the file
   * @param expirationTime Expiration time in seconds (default: 1 hour)
   * @returns Signed URL string
   */
  generateSignedUrl(publicId: string, expirationTime: number = 3600): string {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000) + expirationTime;
      
      return cloudinary.utils.private_download_url(publicId, 'jpg', {
        expires_at: timestamp
      });
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch delete multiple files
   * @param publicIds Array of public IDs to delete
   * @returns Promise of deletion results
   */
  async batchDelete(publicIds: string[]): Promise<{ deleted: string[]; failed: string[] }> {
    const results = {
      deleted: [] as string[],
      failed: [] as string[]
    };

    for (const publicId of publicIds) {
      try {
        await this.deleteFile(publicId);
        results.deleted.push(publicId);
      } catch (error) {
        console.warn(`Failed to delete ${publicId}:`, error);
        results.failed.push(publicId);
      }
    }

    return results;
  }
}