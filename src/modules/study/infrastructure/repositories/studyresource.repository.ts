import { IStudyResourceRepository, ResourceFilter } from '../../domain/interfaces/studyresource.repository.interface';
import { StudyResourceEntity } from '../../domain/entities/studyresource.entity';
import { StudyResourceDTO } from '../../application/dto/studyresource.dto';
import { StudyResourceModel, IStudyResource } from '../models/studyresource.model';
import { Types } from 'mongoose';

/**
 * MongoDB implementation of the StudyResource repository
 * Handles all database operations for study resources
 */
export class StudyResourceRepository implements IStudyResourceRepository {
  /**
   * Retrieves all public resources with optional filtering
   */
  async getPublicResources(filter?: ResourceFilter): Promise<StudyResourceDTO[]> {
    try {
      let query: any = { isPublic: true };
      let sortOptions: any = { createdAt: -1 }; // Newest first

      // Apply filters
      if (filter) {
        if (filter.category) {
          query.category = new RegExp(filter.category, 'i');
        }
        if (filter.type) {
          query.type = filter.type;
        }
        if (filter.search) {
          query.$text = { $search: filter.search };
        }
      }

      const resources = await StudyResourceModel
        .find(query)
        .populate('tutor', 'fullName')
        .sort(sortOptions)
        .lean()
        .exec();

      return resources.map(resource => this.mapToDTO(resource));
    } catch (error) {
      throw new Error(`Failed to retrieve public resources: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Retrieves all resources owned by a specific tutor
   */
  async getMyResources(tutorId: string): Promise<StudyResourceDTO[]> {
    try {
      const objectId = new Types.ObjectId(tutorId);
      
      const resources = await StudyResourceModel
        .find({ tutorId: objectId })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return resources.map(resource => this.mapToDTO(resource));
    } catch (error) {
      throw new Error(`Failed to retrieve tutor resources: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Uploads and saves a new study resource
   */
  async uploadResource(resource: StudyResourceEntity): Promise<StudyResourceDTO> {
    try {
      const newResource = new StudyResourceModel({
        title: resource.title,
        category: resource.category,
        type: resource.type,
        url: resource.url,
        size: resource.size,
        tutorId: resource.tutorId,
        isPublic: resource.isPublic
      });

      const saved = await newResource.save();
      return this.mapToDTO(saved.toObject());
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error('A resource with similar details already exists');
      }
      throw new Error(`Failed to save resource: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Deletes a resource by ID, ensuring ownership verification
   */
  async deleteResource(resourceId: string, tutorId: string): Promise<void> {
    try {
      const resourceObjectId = new Types.ObjectId(resourceId);
      const tutorObjectId = new Types.ObjectId(tutorId);

      const result = await StudyResourceModel.deleteOne({
        _id: resourceObjectId,
        tutorId: tutorObjectId
      });

      if (result.deletedCount === 0) {
        throw new Error('Resource not found or you do not have permission to delete it');
      }
    } catch (error) {
      throw new Error(`Failed to delete resource: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Finds a resource by ID
   */
  async findById(resourceId: string): Promise<StudyResourceEntity | null> {
    try {
      const objectId = new Types.ObjectId(resourceId);
      const resource = await StudyResourceModel.findById(objectId).lean().exec();
      
      if (!resource) {
        return null;
      }

      return this.mapToEntity(resource);
    } catch (error) {
      throw new Error(`Failed to find resource: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Updates an existing resource
   */
  async updateResource(
    resourceId: string,
    updateData: Partial<StudyResourceEntity>,
    tutorId: string
  ): Promise<StudyResourceDTO> {
    try {
      const resourceObjectId = new Types.ObjectId(resourceId);
      const tutorObjectId = new Types.ObjectId(tutorId);

      const updatedResource = await StudyResourceModel.findOneAndUpdate(
        { _id: resourceObjectId, tutorId: tutorObjectId },
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true, lean: true }
      ).exec();

      if (!updatedResource) {
        throw new Error('Resource not found or you do not have permission to update it');
      }

      return this.mapToDTO(updatedResource);
    } catch (error) {
      throw new Error(`Failed to update resource: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Checks if a resource exists and is owned by the specified tutor
   */
  async verifyOwnership(resourceId: string, tutorId: string): Promise<boolean> {
    try {
      const resourceObjectId = new Types.ObjectId(resourceId);
      const tutorObjectId = new Types.ObjectId(tutorId);

      const count = await StudyResourceModel.countDocuments({
        _id: resourceObjectId,
        tutorId: tutorObjectId
      });

      return count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets aggregate statistics for resources
   */
  async getResourceStatistics(tutorId?: string): Promise<{
    totalResources: number;
    publicResources: number;
    privateResources: number;
    resourcesByType: Record<string, number>;
  }> {
    try {
      const matchStage: any = {};
      if (tutorId) {
        matchStage.tutorId = new Types.ObjectId(tutorId);
      }

      const pipeline = [
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        {
          $group: {
            _id: null,
            totalResources: { $sum: 1 },
            publicResources: {
              $sum: { $cond: [{ $eq: ['$isPublic', true] }, 1, 0] }
            },
            privateResources: {
              $sum: { $cond: [{ $eq: ['$isPublic', false] }, 1, 0] }
            },
            typeGroups: {
              $push: '$type'
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalResources: 1,
            publicResources: 1,
            privateResources: 1,
            resourcesByType: {
              $arrayToObject: {
                $map: {
                  input: ['PDF', 'MODULE', 'OTHER'],
                  as: 'type',
                  in: {
                    k: '$$type',
                    v: {
                      $size: {
                        $filter: {
                          input: '$typeGroups',
                          cond: { $eq: ['$$this', '$$type'] }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ];

      const result = await StudyResourceModel.aggregate(pipeline);
      
      if (result.length === 0) {
        return {
          totalResources: 0,
          publicResources: 0,
          privateResources: 0,
          resourcesByType: { PDF: 0, MODULE: 0, OTHER: 0 }
        };
      }

      return result[0];
    } catch (error) {
      throw new Error(`Failed to get resource statistics: ${error instanceof Error ? error.message : 'Database error'}`);
    }
  }

  /**
   * Maps MongoDB document to DTO
   */
  private mapToDTO(resource: any): StudyResourceDTO {
    return new StudyResourceDTO(
      resource._id.toString(),
      resource.title,
      resource.category || null,
      resource.type,
      resource.url,
      resource.size,
      resource.tutorId.toString(),
      resource.isPublic,
      resource.createdAt,
      resource.updatedAt,
      resource.tutor?.fullName,
      resource.downloadCount || 0
    );
  }

  /**
   * Maps MongoDB document to Entity
   */
  private mapToEntity(resource: any): StudyResourceEntity {
    return new StudyResourceEntity(
      resource.title,
      resource.category || null,
      resource.type,
      resource.url,
      resource.size,
      resource.tutorId,
      resource.isPublic,
      resource.createdAt,
      resource.updatedAt,
      resource._id
    );
  }
}