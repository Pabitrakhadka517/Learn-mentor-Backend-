import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/modules/auth/user.model';
import { Announcement } from '../../src/modules/admin/announcement.model';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

describe('Special Features & Announcements Integration Tests', () => {
    let adminToken: string;
    let studentToken: string;
    let adminId: string;

    beforeEach(async () => {
        const password = await bcrypt.hash('Password123!', 10);

        // Create Admin
        const admin = await User.create({
            email: 'admin_test@example.com',
            passwordHash: password,
            role: 'ADMIN',
            fullName: 'Admin Tester',
            isActive: true
        });
        adminId = (admin._id as any).toString();

        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin_test@example.com', password: 'Password123!' });
        adminToken = adminLogin.body.accessToken;

        // Create Student
        await User.create({
            email: 'student_test@example.com',
            passwordHash: password,
            role: 'STUDENT',
            fullName: 'Student Tester',
            isActive: true
        });

        const studentLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: 'student_test@example.com', password: 'Password123!' });
        studentToken = studentLogin.body.accessToken;

        if (!adminToken || !studentToken) {
            console.error('FAILED TO OBTAIN TOKENS IN BEFOREEACH');
            console.error('Admin response:', adminLogin.body);
            console.error('Student response:', studentLogin.body);
        }
    });

    afterAll(async () => {
    });

    it('31. should allow admin to create an announcement', async () => {
        const res = await request(app)
            .post('/api/admin/announcements')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Test Broadcast',
                content: 'Important updates for everyone',
                targetRole: 'ALL',
                type: 'INFO'
            });

        if (res.status !== 201) console.error('T31 failed:', res.status, res.body);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.announcement.title).toBe('Test Broadcast');
    });

    it('32. should prevent student from creating an announcement', async () => {
        const res = await request(app)
            .post('/api/admin/announcements')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                title: 'Unauthorized',
                content: 'I should not be able to do this',
                targetRole: 'ALL'
            });

        if (res.status !== 403) console.error('T32 failed:', res.status, res.body);
        expect(res.status).toBe(403);
    });

    it('33. should allow fetching active announcements', async () => {
        await Announcement.create({
            title: 'Active News',
            content: 'Read this',
            targetRole: 'ALL',
            createdBy: new mongoose.Types.ObjectId(adminId)
        });

        const res = await request(app)
            .get('/api/admin/announcements')
            .set('Authorization', `Bearer ${studentToken}`);

        if (res.status !== 200) console.error('T33 failed:', res.status, res.body);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.announcements)).toBe(true);
        expect(res.body.announcements.length).toBeGreaterThanOrEqual(1);
    });

    it('34. should allow admin to delete an announcement', async () => {
        const ann = await Announcement.create({
            title: 'Delete Me',
            content: 'Soon gone',
            createdBy: new mongoose.Types.ObjectId(adminId)
        });

        const res = await request(app)
            .delete(`/api/admin/announcements/${ann._id}`)
            .set('Authorization', `Bearer ${adminToken}`);

        if (res.status !== 200) console.error('T34 failed:', res.status, res.body);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const found = await Announcement.findById(ann._id);
        expect(found).toBe(null);
    });

    it('35. should filter announcements by target role', async () => {
        await Announcement.create([
            { title: 'For Everyone', content: '...', targetRole: 'ALL', createdBy: new mongoose.Types.ObjectId(adminId) },
            { title: 'Only For Tutors', content: '...', targetRole: 'TUTOR', createdBy: new mongoose.Types.ObjectId(adminId) }
        ]);

        const res = await request(app)
            .get('/api/admin/announcements')
            .set('Authorization', `Bearer ${studentToken}`);

        if (res.status !== 200) console.error('T35 failed:', res.status, res.body);
        const titles = res.body.announcements?.map((a: any) => a.title) || [];
        expect(titles).toContain('For Everyone');
        expect(titles).not.toContain('Only For Tutors');
    });
});
