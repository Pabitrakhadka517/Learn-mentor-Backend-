"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
describe('Profile Integration Tests', () => {
    let studentToken;
    let studentId;
    const studentData = {
        email: 'student_profile@test.com',
        password: 'Password123!',
        fullName: 'Profile Student',
        role: 'STUDENT'
    };
    beforeEach(async () => {
        const email = `profile_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;
        const profileData = { ...studentData, email };
        await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send(profileData);
        const loginRes = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ email: profileData.email, password: profileData.password });
        studentToken = loginRes.body.accessToken;
        studentId = loginRes.body.user.id;
        studentData.email = email;
    });
    it('21. should fetch current user profile', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/profile')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.email).toBe(studentData.email);
        expect(res.body.name).toBe(studentData.fullName);
    });
    it('22. should update profile name and phone', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .put('/api/profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .field('name', 'Updated Name')
            .field('phone', '9876543210');
        expect(res.status).toBe(200);
        expect(res.body.profile.name).toBe('Updated Name');
        expect(res.body.profile.phone).toBe('9876543210');
    });
    it('23. should change password successfully', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .put('/api/profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .field('oldPassword', studentData.password)
            .field('newPassword', 'NewPassword123!');
        expect(res.status).toBe(200);
        expect(res.body.message).toContain('updated successfully');
        const loginRes = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ email: studentData.email, password: 'NewPassword123!' });
        expect(loginRes.status).toBe(200);
    });
    it('24. should fail update with incorrect old password', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .put('/api/profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .field('oldPassword', 'WrongOldPassword')
            .field('newPassword', 'Whatever123!');
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Current password is incorrect');
    });
    it('25. should return 401 when accessing profile without token', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/profile');
        expect(res.status).toBe(401);
    });
});
//# sourceMappingURL=profile.test.js.map