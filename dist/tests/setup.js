"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.test' });
beforeAll(async () => {
    console.log('--- Attempting to connect to Test MongoDB ---');
    const url = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/learnmentor_test';
    try {
        await mongoose_1.default.connect(url);
        console.log('--- Connected to Test MongoDB ---');
    }
    catch (error) {
        console.error('--- Failed to connect to Test MongoDB ---', error);
        throw error;
    }
});
afterAll(async () => {
    console.log('--- Cleaning up Test MongoDB ---');
    await mongoose_1.default.connection.dropDatabase();
    await mongoose_1.default.connection.close();
    console.log('--- Test MongoDB Disconnected ---');
});
beforeEach(async () => {
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});
//# sourceMappingURL=setup.js.map