"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
class CloudinaryService {
    constructor() {
        this.folderPath = 'learnmentor/resources';
        this.configureCloudinary();
    }
    configureCloudinary() {
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });
    }
    async uploadFile(file) {
        try {
            this.validateFile(file);
            const uploadOptions = this.getUploadOptions(file);
            const uploadResult = await this.uploadStream(file.buffer, uploadOptions);
            return {
                secure_url: uploadResult.secure_url,
                bytes: uploadResult.bytes,
                public_id: uploadResult.public_id
            };
        }
        catch (error) {
            throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteFile(publicId) {
        try {
            if (!publicId) {
                throw new Error('Public ID is required for deletion');
            }
            const result = await cloudinary_1.v2.uploader.destroy(publicId);
            if (result.result !== 'ok' && result.result !== 'not found') {
                throw new Error(`Failed to delete file: ${result.result}`);
            }
        }
        catch (error) {
            throw new Error(`Cloudinary deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    uploadStream(buffer, options) {
        return new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream(options, (error, result) => {
                if (error) {
                    reject(error);
                }
                else if (result) {
                    resolve(result);
                }
                else {
                    reject(new Error('Upload failed: No result returned'));
                }
            });
            const readable = new stream_1.Readable({
                read() {
                    this.push(buffer);
                    this.push(null);
                }
            });
            readable.pipe(stream);
        });
    }
    getUploadOptions(file) {
        const baseOptions = {
            folder: this.folderPath,
            unique_filename: true,
            use_filename: true,
            overwrite: false,
            resource_type: 'auto'
        };
        if (file.mimetype === 'application/pdf') {
            return {
                ...baseOptions,
                resource_type: 'image',
                format: 'pdf'
            };
        }
        if (file.mimetype.startsWith('image/')) {
            return {
                ...baseOptions,
                resource_type: 'image',
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
        return {
            ...baseOptions,
            resource_type: 'raw'
        };
    }
    validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }
        if (!file.buffer) {
            throw new Error('File buffer is empty');
        }
        if (file.size === 0) {
            throw new Error('File is empty');
        }
    }
    async getFileInfo(publicId) {
        try {
            return await cloudinary_1.v2.api.resource(publicId);
        }
        catch (error) {
            throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    generateSignedUrl(publicId, expirationTime = 3600) {
        try {
            const timestamp = Math.round(new Date().getTime() / 1000) + expirationTime;
            return cloudinary_1.v2.utils.private_download_url(publicId, 'jpg', {
                expires_at: timestamp
            });
        }
        catch (error) {
            throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async batchDelete(publicIds) {
        const results = {
            deleted: [],
            failed: []
        };
        for (const publicId of publicIds) {
            try {
                await this.deleteFile(publicId);
                results.deleted.push(publicId);
            }
            catch (error) {
                console.warn(`Failed to delete ${publicId}:`, error);
                results.failed.push(publicId);
            }
        }
        return results;
    }
}
exports.CloudinaryService = CloudinaryService;
//# sourceMappingURL=cloudinary.service.js.map