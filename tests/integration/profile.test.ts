import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/modules/auth/user.model';
import mongoose from 'mongoose';

describe('Profile Integration Tests', () => {
    let studentToken: string;
    let studentId: string;
    const studentData = {
        email: 'student_profile@test.com',
        password: 'Password123!',
        fullName: 'Profile Student',
        role: 'STUDENT'
    };

    beforeEach(async () => {
        // Register and login to get token
        // Use a unique email to avoid "Email already exists" from previous test's register
        const email = `profile_${Date.now()}_${Math.floor(Math.random() * 1000)}@test.com`;
        const profileData = { ...studentData, email };

        await request(app).post('/api/auth/register').send(profileData);
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: profileData.email, password: profileData.password });

        studentToken = loginRes.body.accessToken;
        studentId = loginRes.body.user.id;

        // Update studentData.email so tests use the right expectation
        (studentData as any).email = email;
    });

    it('21. should fetch current user profile', async () => {
        const res = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.email).toBe(studentData.email);
        expect(res.body.name).toBe(studentData.fullName);
    });

    it('22. should update profile name and phone', async () => {
        const res = await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .field('name', 'Updated Name')
            .field('phone', '9876543210');

        expect(res.status).toBe(200);
        expect(res.body.profile.name).toBe('Updated Name');
        expect(res.body.profile.phone).toBe('9876543210');
    });

    it('23. should change password successfully', async () => {
        const res = await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .field('oldPassword', studentData.password)
            .field('newPassword', 'NewPassword123!');

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('updated successfully');

        // Verify login with new password
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: studentData.email, password: 'NewPassword123!' });

        expect(loginRes.status).toBe(200);
    });

    it('24. should fail update with incorrect old password', async () => {
        const res = await request(app)
            .put('/api/profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .field('oldPassword', 'WrongOldPassword')
            .field('newPassword', 'Whatever123!');

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Current password is incorrect');
    });

    it('25. should return 401 when accessing profile without token', async () => {
        const res = await request(app).get('/api/profile');
        expect(res.status).toBe(401);
    });
});
