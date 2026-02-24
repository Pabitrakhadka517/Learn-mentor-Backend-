"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
const mongoose_1 = __importDefault(require("mongoose"));
describe('Auth Integration Tests', () => {
    const testUser = {
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
        role: 'STUDENT'
    };
    describe('POST /api/auth/register', () => {
        it('1. should register a new student successfully', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register')
                .send(testUser);
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body).toHaveProperty('accessToken');
        });
        it('2. should fail when registering with an existing email', async () => {
            await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send(testUser);
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send(testUser);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Email already exists');
        });
        it('3. should fail with invalid email format', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register')
                .send({ ...testUser, email: 'invalid-email' });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Validation failed');
        });
        it('4. should fail with short password', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register')
                .send({ ...testUser, password: '123' });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Validation failed');
        });
        it('5. should register a tutor and create a tutor profile', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/register')
                .send({ ...testUser, email: 'tutor@example.com', role: 'TUTOR' });
            expect(res.status).toBe(201);
            expect(res.body.user.role).toBe('TUTOR');
            const tutorProfile = await mongoose_1.default.connection.collection('tutorprofiles').findOne({ user: new mongoose_1.default.Types.ObjectId(res.body.user.id) });
            expect(tutorProfile).toBeDefined();
            expect(tutorProfile?.verificationStatus).toBe('PENDING');
        });
    });
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send(testUser);
        });
        it('6. should login successfully with correct credentials', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: testUser.password });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('accessToken');
        });
        it('7. should fail with incorrect password', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: 'WrongPassword123' });
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid credentials');
        });
        it('8. should fail with non-existent email', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@example.com', password: testUser.password });
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Invalid credentials');
        });
    });
    describe('Password Reset Flow', () => {
        it('9. should return success message for forgot-password even if email doesnt exist', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/forgot-password')
                .send({ email: 'unknown@example.com' });
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('password reset link has been sent');
        });
        it('10. should create a reset token in database for valid user', async () => {
            await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send(testUser);
            await (0, supertest_1.default)(app_1.default).post('/api/auth/forgot-password').send({ email: testUser.email });
            const token = await mongoose_1.default.connection.collection('passwordresettokens').findOne({});
            expect(token).toBeDefined();
        });
    });
});
//# sourceMappingURL=auth.test.js.map