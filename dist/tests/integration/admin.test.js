"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
const user_model_1 = require("../../src/modules/auth/user.model");
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
describe('Admin Integration Tests', () => {
    let adminToken;
    let adminId;
    beforeEach(async () => {
        const passwordHash = await bcryptjs_1.default.hash('AdminPass123!', 10);
        const admin = await user_model_1.User.create({
            email: 'admin@example.com',
            passwordHash,
            role: 'ADMIN',
            fullName: 'System Admin',
            isActive: true
        });
        adminId = admin._id.toString();
        const loginRes = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ email: 'admin@example.com', password: 'AdminPass123!' });
        adminToken = loginRes.body.accessToken;
    });
    describe('GET /api/admin/users', () => {
        beforeEach(async () => {
            const students = Array.from({ length: 15 }).map((_, i) => ({
                email: `student${i}@test.com`,
                passwordHash: 'hash',
                role: 'STUDENT',
                fullName: `Student ${i}`,
                isActive: true
            }));
            await user_model_1.User.insertMany(students);
        });
        it('11. should fetch users with default pagination (limit 10)', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.users).toHaveLength(10);
            expect(res.body.pagination.total).toBe(16);
            expect(res.body.pagination.page).toBe(1);
        });
        it('12. should fetch page 2 of users', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/admin/users?page=2&limit=10')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.users).toHaveLength(6);
            expect(res.body.pagination.page).toBe(2);
        });
        it('13. should filter users by role STUDENT', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/admin/users?role=STUDENT')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.users.every((u) => u.role === 'STUDENT')).toBe(true);
            expect(res.body.pagination.total).toBe(15);
        });
        it('14. should return 403 for non-admin user', async () => {
            await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
                email: 'student@test.com',
                password: 'Password123!',
                fullName: 'Test Student',
                role: 'STUDENT'
            });
            const loginRes = await (0, supertest_1.default)(app_1.default)
                .post('/api/auth/login')
                .send({ email: 'student@test.com', password: 'Password123!' });
            const studentToken = loginRes.body.accessToken;
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${studentToken}`);
            expect(res.status).toBe(403);
        });
    });
    describe('GET /api/admin/stats', () => {
        it('15. should fetch platform statistics', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('tutors');
            expect(res.body).toHaveProperty('students');
        });
    });
    describe('PATCH /api/admin/tutors/:tutorId/verify', () => {
        let tutorId;
        beforeEach(async () => {
            const tutor = await user_model_1.User.create({
                email: 'tutor@verify.com',
                passwordHash: 'hash',
                role: 'TUTOR',
                fullName: 'Test Tutor',
                isActive: true
            });
            tutorId = tutor._id.toString();
            const { TutorProfile } = require('../../src/modules/tutor/tutor.model');
            await TutorProfile.create({ user: tutor._id, verificationStatus: 'PENDING' });
        });
        it('16. should verify a tutor successfully', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch(`/api/admin/tutors/${tutorId}/verify`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'VERIFIED' });
            expect(res.status).toBe(200);
            expect(res.body.profile.verificationStatus).toBe('VERIFIED');
        });
        it('17. should reject a tutor successfully', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch(`/api/admin/tutors/${tutorId}/verify`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'REJECTED' });
            expect(res.status).toBe(200);
            expect(res.body.profile.verificationStatus).toBe('REJECTED');
        });
        it('18. should return 400 for invalid status', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch(`/api/admin/tutors/${tutorId}/verify`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'INVALID_STATUS' });
            expect(res.status).toBe(400);
        });
        it('19. should return 404 if tutor profile doesnt exist', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch(`/api/admin/tutors/${new mongoose_1.default.Types.ObjectId().toString()}/verify`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'VERIFIED' });
            expect(res.status).toBe(404);
        });
        it('20. should return 401 if not authenticated', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .patch(`/api/admin/tutors/${tutorId}/verify`)
                .send({ status: 'VERIFIED' });
            expect(res.status).toBe(401);
        });
    });
});
//# sourceMappingURL=admin.test.js.map