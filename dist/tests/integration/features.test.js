"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
const user_model_1 = require("../../src/modules/auth/user.model");
const auth_repository_1 = require("../../src/modules/auth/auth.repository");
const announcement_model_1 = require("../../src/modules/admin/announcement.model");
const mongoose_1 = __importDefault(require("mongoose"));
describe('Special Features & Announcements Integration Tests', () => {
    let adminToken;
    let studentToken;
    let adminId;
    beforeEach(async () => {
        const password = await auth_repository_1.AuthRepository.hashPassword('Password123!');
        const admin = await user_model_1.User.create({
            email: 'admin_test@example.com',
            passwordHash: password,
            role: 'ADMIN',
            fullName: 'Admin Tester',
            isActive: true
        });
        adminId = admin._id.toString();
        const adminLogin = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ email: 'admin_test@example.com', password: 'Password123!' });
        adminToken = adminLogin.body?.accessToken;
        if (!adminToken) {
            console.error('FAILED TO LOGIN ADMIN');
            console.error('Admin login status:', adminLogin.status);
            console.error('Admin login body:', JSON.stringify(adminLogin.body, null, 2));
            throw new Error(`Admin login failed: ${adminLogin.body?.message || 'Unknown error'}`);
        }
        await user_model_1.User.create({
            email: 'student_test@example.com',
            passwordHash: password,
            role: 'STUDENT',
            fullName: 'Student Tester',
            isActive: true
        });
        const studentLogin = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ email: 'student_test@example.com', password: 'Password123!' });
        studentToken = studentLogin.body?.accessToken;
        if (!studentToken) {
            console.error('FAILED TO LOGIN STUDENT');
            console.error('Student login status:', studentLogin.status);
            console.error('Student login body:', JSON.stringify(studentLogin.body, null, 2));
            throw new Error(`Student login failed: ${studentLogin.body?.message || 'Unknown error'}`);
        }
    });
    afterAll(async () => {
    });
    it('31. should allow admin to create an announcement', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/admin/announcements')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
            title: 'Test Broadcast',
            content: 'Important updates for everyone',
            targetRole: 'ALL',
            type: 'INFO'
        });
        if (res.status !== 201)
            console.error('T31 failed:', res.status, res.body);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.announcement.title).toBe('Test Broadcast');
    });
    it('32. should prevent student from creating an announcement', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/admin/announcements')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
            title: 'Unauthorized',
            content: 'I should not be able to do this',
            targetRole: 'ALL'
        });
        if (res.status !== 403)
            console.error('T32 failed:', res.status, res.body);
        expect(res.status).toBe(403);
    });
    it('33. should allow fetching active announcements', async () => {
        await announcement_model_1.Announcement.create({
            title: 'Active News',
            content: 'Read this',
            targetRole: 'ALL',
            createdBy: new mongoose_1.default.Types.ObjectId(adminId)
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/admin/announcements')
            .set('Authorization', `Bearer ${studentToken}`);
        if (res.status !== 200)
            console.error('T33 failed:', res.status, res.body);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.announcements)).toBe(true);
        expect(res.body.announcements.length).toBeGreaterThanOrEqual(1);
    });
    it('34. should allow admin to delete an announcement', async () => {
        const ann = await announcement_model_1.Announcement.create({
            title: 'Delete Me',
            content: 'Soon gone',
            createdBy: new mongoose_1.default.Types.ObjectId(adminId)
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .delete(`/api/admin/announcements/${ann._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
        if (res.status !== 200)
            console.error('T34 failed:', res.status, res.body);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const found = await announcement_model_1.Announcement.findById(ann._id);
        expect(found).toBe(null);
    });
    it('35. should filter announcements by target role', async () => {
        await announcement_model_1.Announcement.create([
            { title: 'For Everyone', content: '...', targetRole: 'ALL', createdBy: new mongoose_1.default.Types.ObjectId(adminId) },
            { title: 'Only For Tutors', content: '...', targetRole: 'TUTOR', createdBy: new mongoose_1.default.Types.ObjectId(adminId) }
        ]);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/admin/announcements')
            .set('Authorization', `Bearer ${studentToken}`);
        if (res.status !== 200)
            console.error('T35 failed:', res.status, res.body);
        const titles = res.body.announcements?.map((a) => a.title) || [];
        expect(titles).toContain('For Everyone');
        expect(titles).not.toContain('Only For Tutors');
    });
});
//# sourceMappingURL=features.test.js.map