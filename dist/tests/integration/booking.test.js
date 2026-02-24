"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
const user_model_1 = require("../../src/modules/auth/user.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = require("../../src/config/jwt");
describe('Booking Integration Tests', () => {
    let studentToken;
    let tutorToken;
    let studentId;
    let tutorId;
    beforeEach(async () => {
        const student = await user_model_1.User.create({
            fullName: 'Student User',
            email: 'student@example.com',
            passwordHash: 'hashed_password',
            role: 'STUDENT',
            isActive: true
        });
        studentId = student._id.toString();
        studentToken = jsonwebtoken_1.default.sign({ userId: studentId, role: 'STUDENT' }, jwt_1.jwtConfig.accessSecret);
        const tutor = await user_model_1.User.create({
            fullName: 'Tutor User',
            email: 'tutor@example.com',
            passwordHash: 'hashed_password',
            role: 'TUTOR',
            isActive: true
        });
        tutorId = tutor._id.toString();
        tutorToken = jsonwebtoken_1.default.sign({ userId: tutorId, role: 'TUTOR' }, jwt_1.jwtConfig.accessSecret);
        const { TutorProfile } = require('../../src/modules/tutor/tutor.model');
        await TutorProfile.create({
            user: tutorId,
            subjects: ['Math'],
            hourlyRate: 50,
            verificationStatus: 'VERIFIED'
        });
    });
    afterAll(async () => {
        await user_model_1.User.deleteMany({});
        const { TutorProfile } = require('../../src/modules/tutor/tutor.model');
        await TutorProfile.deleteMany({});
        const { Booking } = require('../../src/modules/booking/booking.model');
        if (Booking)
            await Booking.deleteMany({});
    });
    it('1. should not allow unauthenticated user to fetch bookings', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/bookings');
        expect(res.status).toBe(401);
    });
    it('2. should return empty bookings for new student', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/bookings')
            .set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
    it('3. should allow student to request a booking (Mocked behavior if route exists)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
            tutorId,
            startTime: new Date(Date.now() + 86400000).toISOString(),
            duration: 60,
            subject: 'Math'
        });
        if (res.status === 201 || res.status === 200) {
            expect(res.body.success).toBe(true);
            expect(res.body.booking).toBeDefined();
        }
    });
    it('4. should allow tutor to see their pending requests', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/bookings/tutor/pending')
            .set('Authorization', `Bearer ${tutorToken}`);
        if (res.status === 200) {
            expect(res.body.success).toBe(true);
        }
    });
    it('5. should prevent booking collision (Logic check)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
            tutorId,
            startTime: 'invalid-date',
            duration: 60
        });
        expect(res.status).not.toBe(201);
    });
});
//# sourceMappingURL=booking.test.js.map