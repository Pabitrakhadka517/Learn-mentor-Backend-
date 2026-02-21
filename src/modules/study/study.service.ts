import { StudyResource, IStudyResource } from './study.model';
import cloudinary from '../../config/cloudinary';
import { Types } from 'mongoose';

export class StudyService {
    /**
     * Get all public study resources
     */
    static async getPublicResources(category?: string) {
        const query: any = { isPublic: true };
        if (category && category !== 'All') {
            query.category = category;
        }
        return await StudyResource.find(query).populate('tutor', 'fullName profileImage').sort({ createdAt: -1 });
    }

    /**
     * Get resources uploaded by a specific tutor
     */
    static async getTutorResources(tutorId: string) {
        return await StudyResource.find({ tutor: new Types.ObjectId(tutorId) }).sort({ createdAt: -1 });
    }

    /**
     * Upload a new study resource
     */
    static async uploadResource(tutorId: string, data: any, file: Express.Multer.File) {
        try {
            // Upload to Cloudinary
            const resourceType = 'raw';

            const result = await new Promise<any>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'learnmentor/study-materials',
                        resource_type: 'auto'
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(file.buffer);
            });

            // Create resource record
            const newResource = new StudyResource({
                title: data.title,
                category: data.category,
                type: data.type,
                url: result.secure_url,
                size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                tutor: new Types.ObjectId(tutorId),
                isPublic: data.isPublic === 'true' || data.isPublic === true
            });

            return await newResource.save();
        } catch (error: any) {
            console.error('Study Upload Error:', error);
            throw new Error(`Resource upload failed: ${error.message}`);
        }
    }

    /**
     * Delete a resource
     */
    static async deleteResource(resourceId: string, tutorId: string) {
        const resource = await StudyResource.findOne({ _id: resourceId, tutor: tutorId });
        if (!resource) {
            throw new Error('Resource not found or unauthorized');
        }

        // Potential Cloudinary cleanup would go here

        return await StudyResource.findByIdAndDelete(resourceId);
    }
}
