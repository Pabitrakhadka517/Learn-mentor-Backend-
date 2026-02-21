import { TutorProfile, AvailabilitySlot } from './tutor.model';
import { TutorQueryDTO, TutorResponseDTO } from './tutor.dto';
import { User } from '../auth/user.model';
import { Types } from 'mongoose';

export class TutorService {
    /**
     * Get list of verified tutors with filtering, searching, and sorting
     */
    static async getTutors(query: TutorQueryDTO): Promise<TutorResponseDTO> {
        const {
            subject,
            minPrice,
            maxPrice,
            language,
            availability,
            search,
            sortBy,
            page,
            limit,
            verifiedOnly
        } = query;

        const pipeline: any[] = [];

        // 1. Initial Match: Verified or Pending Tutors (to show them in dashboard as requested)
        const matchStage: any = {
            verificationStatus: verifiedOnly ? 'VERIFIED' : { $in: ['VERIFIED', 'PENDING'] }
        };

        // Filter by Subject
        if (subject) {
            matchStage.subjects = { $in: [new RegExp(subject, 'i')] }; // Case-insensitive partial match
        }

        // Filter by Language
        if (language) {
            matchStage.languages = { $in: [new RegExp(language, 'i')] };
        }

        // Filter by Price Range
        if (minPrice !== undefined || maxPrice !== undefined) {
            matchStage.hourlyRate = {};
            if (minPrice !== undefined) matchStage.hourlyRate.$gte = minPrice;
            if (maxPrice !== undefined) matchStage.hourlyRate.$lte = maxPrice;
        }

        pipeline.push({ $match: matchStage });

        // 2. Lookup User Details (for name search and profile info)
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            }
        });

        // 3. Unwind User Details (preserve nulls just in case, though schema enforces required)
        pipeline.push({
            $unwind: {
                path: '$userDetails',
                preserveNullAndEmptyArrays: true
            }
        });

        // 4. Search by Name or Bio (if search term provided)
        if (search) {
            const regex = new RegExp(search, 'i');
            pipeline.push({
                $match: {
                    $or: [
                        { 'userDetails.fullName': { $regex: regex } },
                        { bio: { $regex: regex } },
                        { subjects: { $in: [regex] } } // Also search within subjects
                    ]
                }
            });
        }

        // 5. Lookup Availability (if needed or for next slot)
        // We always want nextAvailableSlot, so let's do a lookup but limit it
        // To optimize, we only fetch future available slots
        const now = new Date();

        pipeline.push({
            $lookup: {
                from: 'availabilityslots',
                let: { tutorId: '$user' }, // User ID matches tutorId in slots
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$tutorId', '$$tutorId'] },
                                    { $eq: ['$isBooked', false] },
                                    { $gt: ['$startTime', now] }
                                ]
                            }
                        }
                    },
                    { $sort: { startTime: 1 } },
                    { $limit: 1 } // Only get the very next slot for efficiency
                ],
                as: 'nextSlot'
            }
        });

        // If availability filter is explicitly true, filter out those without slots
        if (availability) {
            pipeline.push({
                $match: {
                    'nextSlot': { $ne: [] }
                }
            });
        }

        // Flatten nextSlot for easier access
        pipeline.push({
            $addFields: {
                nextAvailableSlot: { $arrayElemAt: ['$nextSlot', 0] }
            }
        });

        // 6. Project Fields (Clean Response)
        pipeline.push({
            $project: {
                _id: '$user', // Using User ID as the primary identifier for frontend
                profileId: '$_id',
                fullName: '$userDetails.fullName',
                profileImage: '$userDetails.profileImage',
                bio: 1,
                experienceYears: 1,
                hourlyRate: 1,
                languages: 1,
                subjects: 1,
                rating: { $ifNull: ['$averageRating', 0] },
                reviewCount: { $ifNull: ['$totalReviews', 0] },
                averageRating: 1,
                totalReviews: 1,
                verificationStatus: 1,
                nextAvailableSlot: { $ifNull: ['$nextAvailableSlot', null] },
                createdAt: 1
            }
        });

        // 7. Sort
        let sortStage: any = {};
        if (sortBy === 'price_asc') {
            sortStage = { hourlyRate: 1 };
        } else if (sortBy === 'price_desc') {
            sortStage = { hourlyRate: -1 };
        } else if (sortBy === 'rating') {
            sortStage = { averageRating: -1, totalReviews: -1 };
        } else {
            // Default sort as per requirement: averageRating DESC, totalReviews DESC
            // But usually we might want createdAt. The prompt says 'In tutor listing API: Sort by: averageRating DESC, totalReviews DESC'
            // I will make this the default if no sortBy is provided, or just update the 'rating' sort.
            // Let's make 'rating' the default sort if not specified, or update the generic default.
            // If I change default global sort, it might affect "Newest" expectations.
            // I'll update the 'rating' case and maybe default to it if that's the primary way to view.
            // However, typically users want to see top rated.
            sortStage = { averageRating: -1, totalReviews: -1 };
        }

        pipeline.push({ $sort: sortStage });

        // 8. Facet for Pagination
        pipeline.push({
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [{ $skip: (page - 1) * limit }, { $limit: limit }]
            }
        });

        // Execute Aggregation
        const result = await TutorProfile.aggregate(pipeline);

        const metadata = result[0].metadata[0];
        const total = metadata ? metadata.total : 0;
        const tutors = result[0].data;

        return {
            tutors,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Get single tutor by ID with full details
     */
    static async getTutorById(tutorId: string): Promise<any> {
        // Validate ID format
        if (!Types.ObjectId.isValid(tutorId)) {
            throw new Error('Tutor not found');
        }

        // Support finding by Profile ID OR User ID
        let tutor = await TutorProfile.findById(tutorId)
            .populate('user', 'fullName email profileImage phone location')
            .lean();

        if (!tutor) {
            // Try searching by User ID
            tutor = await TutorProfile.findOne({ user: tutorId })
                .populate('user', 'fullName email profileImage phone location')
                .lean();
        }

        if (!tutor) {
            throw new Error('Tutor not found');
        }

        if (tutor.verificationStatus === 'REJECTED') {
            throw new Error('Tutor profile is not available');
        }

        // Fetch available slots for this tutor
        const now = new Date();
        const slots = await AvailabilitySlot.find({
            tutorId: tutor.user._id, // Assuming tutor.user is populated object
            startTime: { $gt: now },
            isBooked: false
        })
            .sort({ startTime: 1 })
            .limit(20) // Limit slots for detail view
            .lean();

        return {
            ...tutor,
            _id: (tutor.user as any)._id, // Ensure User ID is returned as the primary ID
            profileId: tutor._id,
            fullName: (tutor.user as any).fullName,
            email: (tutor.user as any).email,
            profileImage: (tutor.user as any).profileImage,
            availableSlots: slots
        };
    }

    /**
     * Get availability slots for a tutor
     */
    static async getAvailabilitySlots(tutorId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
        const query: any = { tutorId: new Types.ObjectId(tutorId) };

        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) query.startTime.$gte = startDate;
            if (endDate) query.startTime.$lte = endDate;
        }

        return await AvailabilitySlot.find(query).sort({ startTime: 1 }).lean();
    }

    /**
     * setAvailabilitySlots (Sync slots)
     * Replaces future unbooked slots with new ones
     */
    static async setAvailabilitySlots(tutorId: string, slots: { startTime: Date, endTime: Date }[]): Promise<void> {
        const tid = new Types.ObjectId(tutorId);
        const now = new Date();

        // 1. Delete all future unbooked slots for this tutor
        await AvailabilitySlot.deleteMany({
            tutorId: tid,
            startTime: { $gt: now },
            isBooked: false
        });

        // 2. Insert new slots
        if (slots.length > 0) {
            const slotsToInsert = slots.map(slot => ({
                tutorId: tid,
                startTime: new Date(slot.startTime),
                endTime: new Date(slot.endTime),
                isBooked: false
            }));
            await AvailabilitySlot.insertMany(slotsToInsert);
        }
    }

    /**
     * Submit tutor profile for verification
     */
    static async submitVerification(tutorId: string): Promise<void> {
        await TutorProfile.findOneAndUpdate(
            { user: new Types.ObjectId(tutorId) },
            { verificationStatus: 'PENDING' },
            { upsert: true }
        );
    }
}
