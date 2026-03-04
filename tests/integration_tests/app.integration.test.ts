import request from 'supertest';
import app from '../../src/app';

describe('App Integration Tests', () => {
  // Should return health payload for service monitoring.
  it('GET /health returns 200 with success response', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Server is healthy');
    expect(typeof response.body.timestamp).toBe('string');
  });

  // Should serve API landing page HTML.
  it('GET / returns 200 and contains API server heading', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('LearnMentor API Server');
    expect(response.text).toContain('/swagger');
  });

  // Should return standardized not-found payload for unknown route.
  it('GET /does-not-exist returns 404 with not found message', async () => {
    const response = await request(app).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Route /does-not-exist not found');
  });

  // Should expose swagger endpoint successfully.
  it('GET /swagger returns a successful response', async () => {
    const response = await request(app).get('/swagger');

    expect([200, 301, 302]).toContain(response.status);
  });

  // Should reject protected auth endpoint when token is missing.
  it('GET /api/auth/me returns 401 without Bearer token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No token provided. Please login.');
  });

  // Should reject another protected endpoint when token is missing.
  it('GET /api/dashboard/student returns 401 without Bearer token', async () => {
    const response = await request(app).get('/api/dashboard/student');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No token provided. Please login.');
  });

  // Should allow localhost origins in non-production mode via CORS.
  it('GET /health includes CORS allow-origin for localhost', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  // Should return legacy success code for CORS preflight requests.
  it('OPTIONS /health returns 200 for preflight', async () => {
    const response = await request(app)
      .options('/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBe(200);
  });
});
