import { User } from '../auth/user.model';
import { AuthRepository } from '../auth/auth.repository';
import { TutorProfile, AvailabilitySlot } from './tutor.model';
import dotenv from 'dotenv';

dotenv.config();

// Simple random generator helper if faker is not installed
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function seedTutors(count: number = 10) {
    try {
        console.log(`🌱 Seeding ${count} tutors...`);

        // Create random subjects and languages
        const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science', 'Art'];
        const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];

        for (let i = 0; i < count; i++) {
            const email = `tutor${Date.now()}_${i}@example.com`;
            const passwordHash = await AuthRepository.hashPassword('Pass@123'); // Default password

            // Create User
            const user = await AuthRepository.createUser(
                email,
                passwordHash,
                'TUTOR',
                `Tutor ${i + 1}`,
                `+1${randomInt(1000000000, 9999999999)}`
            );

            // Mark as verified
            user.isVerified = true;
            await user.save();

            // Create Tutor Profile
            const profile = await TutorProfile.create({
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

            // Create Availability Slots
            const slotsCount = randomInt(3, 10);
            const now = new Date();

            for (let j = 0; j < slotsCount; j++) {
                const startTime = new Date(now);
                startTime.setDate(now.getDate() + randomInt(1, 7)); // Next 7 days
                startTime.setHours(randomInt(8, 18), 0, 0, 0); // 8 AM to 6 PM

                const endTime = new Date(startTime);
                endTime.setHours(startTime.getHours() + 1); // 1 hour slots

                await AvailabilitySlot.create({
                    tutorId: user._id, // References User ID as per schema
                    startTime,
                    endTime,
                    isBooked: Math.random() < 0.3 // 30% chance of being booked
                });
            }
        }

        console.log('✅ Tutors seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding tutors:', error);
    }
}

// Allow running directly
if (require.main === module) {
    const mongoose = require('mongoose');
    const connectDB = require('../../config/db').default;

    connectDB()
        .then(() => seedTutors(5))
        .then(() => {
            console.log('Seeding completed');
            process.exit(0);
        })
        .catch((error: any) => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
}
