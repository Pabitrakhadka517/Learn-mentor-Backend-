import request from 'supertest';
import app from '../../src/app';

describe('Sanity Check', () => {
    it('should respond with 200 to health check', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Server is healthy');
    });
});
