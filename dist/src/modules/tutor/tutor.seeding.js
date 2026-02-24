"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTutors = seedTutors;
const auth_repository_1 = require("../auth/auth.repository");
const tutor_model_1 = require("./tutor.model");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
async function seedTutors(count = 10) {
    try {
        console.log(`🌱 Seeding ${count} tutors...`);
        const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science', 'Art'];
        const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];
        for (let i = 0; i < count; i++) {
            const email = `tutor${Date.now()}_${i}@example.com`;
            const passwordHash = await auth_repository_1.AuthRepository.hashPassword('Pass@123');
            const user = await auth_repository_1.AuthRepository.createUser(email, passwordHash, 'TUTOR', `Tutor ${i + 1}`, `+1${randomInt(1000000000, 9999999999)}`);
            user.isVerified = true;
            await user.save();
            const profile = await tutor_model_1.TutorProfile.create({
                user: user._id,
                bio: `I am an experienced tutor specializing in ${randomElement(subjects)}. ` +
                    `I have been teaching for ${randomInt(1, 15)} years.`,
                experienceYears: randomInt(1, 20),
                hourlyRate: randomInt(20, 100),
                languages: [randomElement(languages), 'English'],
                subjects: [randomElement(subjects), randomElement(subjects)],
                verificationStatus: 'VERIFIED',
                rating: randomInt(3, 5),
                reviewsCount: randomInt(0, 50)
            });
            const slotsCount = randomInt(3, 10);
            const now = new Date();
            for (let j = 0; j < slotsCount; j++) {
                const startTime = new Date(now);
                startTime.setDate(now.getDate() + randomInt(1, 7));
                startTime.setHours(randomInt(8, 18), 0, 0, 0);
                const endTime = new Date(startTime);
                endTime.setHours(startTime.getHours() + 1);
                await tutor_model_1.AvailabilitySlot.create({
                    tutorId: user._id,
                    startTime,
                    endTime,
                    isBooked: Math.random() < 0.3
                });
            }
        }
        console.log('✅ Tutors seeded successfully');
    }
    catch (error) {
        console.error('❌ Error seeding tutors:', error);
    }
}
if (require.main === module) {
    const mongoose = require('mongoose');
    const connectDB = require('../../config/db').default;
    connectDB()
        .then(() => seedTutors(5))
        .then(() => {
        console.log('Seeding completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=tutor.seeding.js.map