import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
    console.log('--- Attempting to connect to Test MongoDB ---');
    const url = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/learnmentor_test';
    try {
        await mongoose.connect(url);
        console.log('--- Connected to Test MongoDB ---');
    } catch (error) {
        console.error('--- Failed to connect to Test MongoDB ---', error);
        throw error;
    }
});

afterAll(async () => {
    console.log('--- Cleaning up Test MongoDB ---');
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    console.log('--- Test MongoDB Disconnected ---');
});

beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});
