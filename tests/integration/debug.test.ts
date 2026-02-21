import request from 'supertest';
import app from '../../src/app';

describe('Debug Test with App', () => {
    it('should load app', async () => {
        expect(app).toBeDefined();
    });
});
