"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedStudyResources = seedStudyResources;
const study_model_1 = require("./study.model");
const user_model_1 = require("../auth/user.model");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
async function seedStudyResources() {
    try {
        console.log('🌱 Seeding study resources...');
        const tutors = await user_model_1.User.find({ role: 'TUTOR' }).limit(3);
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
            const existing = await study_model_1.StudyResource.findOne({ title: resourceData.title });
            if (!existing) {
                const res = await study_model_1.StudyResource.create(resourceData);
                seededResources.push(res);
            }
        }
        console.log(`✅ Successfully seeded ${seededResources.length} study resources`);
    }
    catch (error) {
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
        .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=study.seeding.js.map