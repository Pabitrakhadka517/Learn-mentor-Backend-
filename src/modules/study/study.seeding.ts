import { StudyResource } from './study.model';
import { User } from '../auth/user.model';
import { TutorProfile } from '../tutor/tutor.model';
import dotenv from 'dotenv';

dotenv.config();

const RESOURCES = [
    {
        title: 'Mastering Linear Algebra',
        category: 'Math',
        type: 'PDF',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        size: '2.5 MB',
        isPublic: true
    },
    {
        title: 'Quantum Mechanics for Beginners',
        category: 'Science',
        type: 'PDF',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        size: '3.1 MB',
        isPublic: true
    },
    {
        title: 'Spanish Grammar Fundamentals',
        category: 'Language',
        type: 'PDF',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        size: '1.8 MB',
        isPublic: true
    },
    {
        title: 'Advance React Patterns',
        category: 'Computer',
        type: 'MODULE',
        url: 'https://reactjs.org/docs/getting-started.html',
        size: '500 KB',
        isPublic: true
    },
    {
        title: 'Calculus III Deep Dive',
        category: 'Math',
        type: 'PDF',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        size: '4.2 MB',
        isPublic: true
    },
    {
        title: 'Chemical Equations Guide',
        category: 'Science',
        type: 'PDF',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        size: '3.2 MB',
        isPublic: true
    },
    {
        title: 'French Conversation Basics',
        category: 'Language',
        type: 'PDF',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        size: '2.8 MB',
        isPublic: true
    },
    {
        title: 'English Composition 101',
        category: 'Language',
        type: 'PDF',
        url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
        size: '1.2 MB',
        isPublic: true
    }
];

export async function seedStudyResources() {
    try {
        console.log('🌱 Seeding study resources...');

        // Find some tutors to associate resources with
        const tutors = await User.find({ role: 'TUTOR' }).limit(3);

        if (tutors.length === 0) {
            console.log('⚠️ No tutors found. Please seed tutors first.');
            return;
        }

        const seededResources = [];
        for (let i = 0; i < RESOURCES.length; i++) {
            const tutor = tutors[i % tutors.length];
            const resourceData = {
                ...RESOURCES[i],
                tutor: tutor._id
            };

            // Avoid duplicates
            const existing = await StudyResource.findOne({ title: resourceData.title });
            if (!existing) {
                const res = await StudyResource.create(resourceData);
                seededResources.push(res);
            }
        }

        console.log(`✅ Successfully seeded ${seededResources.length} study resources`);
    } catch (error) {
        console.error('❌ Error seeding study resources:', error);
    }
}

if (require.main === module) {
    const mongoose = require('mongoose');
    const connectDB = require('../../config/db').default;

    connectDB()
        .then(() => seedStudyResources())
        .then(() => {
            console.log('Seeding completed');
            process.exit(0);
        })
        .catch((error: any) => {
            console.error('Seeding failed:', error);
            process.exit(1);
        });
}
