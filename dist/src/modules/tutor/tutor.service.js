"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorService = void 0;
const tutor_model_1 = require("./tutor.model");
const user_model_1 = require("../auth/user.model");
const mongoose_1 = require("mongoose");
class TutorService {
    static async resolveTutorUserId(identifier) {
        if (!mongoose_1.Types.ObjectId.isValid(identifier)) {
            throw new Error('Tutor not found');
        }
        const userById = await user_model_1.User.findById(identifier).lean();
        if (userById?.role === 'TUTOR') {
            return String(userById._id);
        }
        const profile = await tutor_model_1.TutorProfile.findById(identifier).lean();
        if (profile) {
            return String(profile.user);
        }
        const tutorProfile = await tutor_model_1.TutorProfile.findOne({ user: identifier }).lean();
        if (tutorProfile) {
            return String(tutorProfile.user);
        }
        throw new Error('Tutor not found');
    }
    static normalizeAndValidateSlots(rawSlots) {
        const now = Date.now();
        const parsed = rawSlots.map((slot) => {
            const startTime = new Date(slot.startTime);
            const endTime = new Date(slot.endTime);
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                throw new Error('Invalid slot date/time format');
            }
            if (startTime >= endTime) {
                throw new Error('Each slot must have endTime after startTime');
            }
            if (startTime.getTime() <= now) {
                return null;
            }
            return { startTime, endTime };
        }).filter((slot) => slot !== null);
        parsed.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        for (let index = 1; index < parsed.length; index++) {
            const previous = parsed[index - 1];
            const current = parsed[index];
            if (current.startTime < previous.endTime) {
                throw new Error('Availability slots cannot overlap');
            }
        }
        const deduped = [];
        const seen = new Set();
        for (const slot of parsed) {
            const key = `${slot.startTime.toISOString()}|${slot.endTime.toISOString()}`;
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            deduped.push(slot);
        }
        return deduped;
    }
    static async getTutors(query) {
        const { subject, minPrice, maxPrice, language, availability, search, sortBy, page, limit, verifiedOnly } = query;
        const pipeline = [];
        const matchStage = {
            verificationStatus: verifiedOnly ? 'VERIFIED' : { $in: ['VERIFIED', 'PENDING'] }
        };
        if (subject) {
            matchStage.subjects = { $in: [new RegExp(subject, 'i')] };
        }
        if (language) {
            matchStage.languages = { $in: [new RegExp(language, 'i')] };
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            matchStage.hourlyRate = {};
            if (minPrice !== undefined)
                matchStage.hourlyRate.$gte = minPrice;
            if (maxPrice !== undefined)
                matchStage.hourlyRate.$lte = maxPrice;
        }
        pipeline.push({ $match: matchStage });
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            }
        });
        pipeline.push({
            $unwind: {
                path: '$userDetails',
                preserveNullAndEmptyArrays: true
            }
        });
        if (search) {
            const regex = new RegExp(search, 'i');
            pipeline.push({
                $match: {
                    $or: [
                        { 'userDetails.fullName': { $regex: regex } },
                        { bio: { $regex: regex } },
                        { subjects: { $in: [regex] } }
                    ]
                }
            });
        }
        const now = new Date();
        pipeline.push({
            $lookup: {
                from: 'availabilityslots',
                let: { tutorId: '$user' },
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
                    { $limit: 1 }
                ],
                as: 'nextSlot'
            }
        });
        if (availability) {
            pipeline.push({
                $match: {
                    'nextSlot': { $ne: [] }
                }
            });
        }
        pipeline.push({
            $addFields: {
                nextAvailableSlot: { $arrayElemAt: ['$nextSlot', 0] }
            }
        });
        pipeline.push({
            $project: {
                _id: '$user',
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
        let sortStage = {};
        if (sortBy === 'price_asc') {
            sortStage = { hourlyRate: 1 };
        }
        else if (sortBy === 'price_desc') {
            sortStage = { hourlyRate: -1 };
        }
        else if (sortBy === 'rating') {
            sortStage = { averageRating: -1, totalReviews: -1 };
        }
        else {
            sortStage = { averageRating: -1, totalReviews: -1 };
        }
        pipeline.push({ $sort: sortStage });
        pipeline.push({
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [{ $skip: (page - 1) * limit }, { $limit: limit }]
            }
        });
        const result = await tutor_model_1.TutorProfile.aggregate(pipeline);
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
    static async getTutorById(tutorId) {
        const resolvedTutorUserId = await this.resolveTutorUserId(tutorId);
        const tutor = await tutor_model_1.TutorProfile.findOne({ user: resolvedTutorUserId })
            .populate('user', 'fullName email profileImage phone location')
            .lean();
        if (!tutor) {
            throw new Error('Tutor not found');
        }
        if (tutor.verificationStatus === 'REJECTED') {
            throw new Error('Tutor profile is not available');
        }
        const now = new Date();
        const slots = await tutor_model_1.AvailabilitySlot.find({
            tutorId: tutor.user._id,
            startTime: { $gt: now },
            isBooked: false
        })
            .sort({ startTime: 1 })
            .limit(20)
            .lean();
        return {
            ...tutor,
            _id: tutor.user._id,
            profileId: tutor._id,
            fullName: tutor.user.fullName,
            email: tutor.user.email,
            profileImage: tutor.user.profileImage,
            availableSlots: slots
        };
    }
    static async getAvailabilitySlots(tutorId, startDate, endDate) {
        const query = { tutorId: new mongoose_1.Types.ObjectId(tutorId) };
        if (startDate || endDate) {
            query.startTime = {};
            if (startDate)
                query.startTime.$gte = startDate;
            if (endDate)
                query.startTime.$lte = endDate;
        }
        return await tutor_model_1.AvailabilitySlot.find(query).sort({ startTime: 1 }).lean();
    }
    static async getPublicAvailabilitySlots(tutorIdentifier, startDate, endDate) {
        const tutorUserId = await this.resolveTutorUserId(tutorIdentifier);
        const now = new Date();
        const query = {
            tutorId: new mongoose_1.Types.ObjectId(tutorUserId),
            isBooked: false,
            startTime: { $gte: startDate && startDate > now ? startDate : now }
        };
        if (endDate) {
            query.startTime.$lte = endDate;
        }
        return await tutor_model_1.AvailabilitySlot.find(query)
            .sort({ startTime: 1 })
            .limit(120)
            .lean();
    }
    static async setAvailabilitySlots(tutorId, slots) {
        const tid = new mongoose_1.Types.ObjectId(tutorId);
        const now = new Date();
        const normalizedSlots = this.normalizeAndValidateSlots(slots);
        await tutor_model_1.AvailabilitySlot.deleteMany({
            tutorId: tid,
            startTime: { $gt: now },
            isBooked: false
        });
        if (normalizedSlots.length > 0) {
            const slotsToInsert = normalizedSlots.map(slot => ({
                tutorId: tid,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isBooked: false
            }));
            await tutor_model_1.AvailabilitySlot.insertMany(slotsToInsert);
        }
    }
    static async submitVerification(tutorId) {
        await tutor_model_1.TutorProfile.findOneAndUpdate({ user: new mongoose_1.Types.ObjectId(tutorId) }, { verificationStatus: 'PENDING' }, { upsert: true });
    }
}
exports.TutorService = TutorService;
//# sourceMappingURL=tutor.service.js.map