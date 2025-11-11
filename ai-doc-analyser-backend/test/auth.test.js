import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Authentication Tests', () => {
  let accessToken;
  let refreshToken;
  let apiKey;
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPassword123!'
  };

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('username', testUser.username);
      expect(response.body.user).not.toHaveProperty('password');

      // Save tokens for later tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should reject registration with existing email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'weak@example.com',
          username: 'weakuser',
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('at least 8 characters');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          username: 'testuser2',
          password: 'Password123!'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('valid email');
    });

    it('should reject registration without required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'incomplete@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login without email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: testUser.password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /auth/me', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No token provided');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      
      // Update tokens
      accessToken = response.body.accessToken;
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid_refresh_token' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/change-password', () => {
    const newPassword = 'NewPassword456!';

    it('should change password with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: testUser.password,
          newPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should login with new password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      
      // Update token
      accessToken = response.body.accessToken;
    });

    it('should reject password change with wrong old password', async () => {
      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: 'WrongOldPassword123!',
          newPassword: 'AnotherPassword789!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject weak new password', async () => {
      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          oldPassword: newPassword,
          newPassword: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject password change without token', async () => {
      const response = await request(app)
        .post('/auth/change-password')
        .send({
          oldPassword: newPassword,
          newPassword: 'ValidPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/rotate-api-key', () => {
    it('should rotate API key with valid token', async () => {
      const response = await request(app)
        .post('/auth/rotate-api-key')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('apiKey');
      expect(response.body.apiKey).toMatch(/^aiDoc_[a-f0-9]{32}$/);
      
      // Save API key
      apiKey = response.body.apiKey;
    });

    it('should reject API key rotation without token', async () => {
      const response = await request(app)
        .post('/auth/rotate-api-key');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /auth/password-requirements', () => {
    it('should return password requirements', async () => {
      const response = await request(app)
        .get('/auth/password-requirements');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requirements');
      expect(Array.isArray(response.body.requirements)).toBe(true);
      expect(response.body.requirements.length).toBeGreaterThan(0);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Protected Endpoints - JWT Authentication', () => {
    beforeAll(async () => {
      // Login to get fresh token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@aidoc.local',
          password: 'Machten@007'
        });
      
      accessToken = loginResponse.body.accessToken;
    });

    it('should reject /upload without authentication', async () => {
      const response = await request(app)
        .post('/upload');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should allow /upload with valid JWT token', async () => {
      const response = await request(app)
        .post('/upload')
        .set('Authorization', `Bearer ${accessToken}`);

      // Should get past auth but fail on missing file
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No file uploaded');
    });

    it('should reject /ask without authentication', async () => {
      const response = await request(app)
        .post('/ask')
        .send({
          question: 'Test question',
          content: 'Test content'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should allow /ask with valid JWT token', async () => {
      const response = await request(app)
        .post('/ask')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: 'What is AI?',
          content: 'Artificial Intelligence is the simulation of human intelligence by machines.'
        });

      // Should get past auth (may fail on AI API but that's ok)
      expect([200, 500, 503]).toContain(response.status);
    }, 30000);
  });

  describe('Protected Endpoints - API Key Authentication', () => {
    beforeAll(async () => {
      // Get API key
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@aidoc.local',
          password: 'Machten@007'
        });
      
      const token = loginResponse.body.accessToken;
      
      const apiKeyResponse = await request(app)
        .post('/auth/rotate-api-key')
        .set('Authorization', `Bearer ${token}`);
      
      apiKey = apiKeyResponse.body.apiKey;
    });

    it('should allow /upload with valid API key', async () => {
      const response = await request(app)
        .post('/upload')
        .set('X-API-Key', apiKey);

      // Should get past auth but fail on missing file
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No file uploaded');
    });

    it('should allow /ask with valid API key', async () => {
      const response = await request(app)
        .post('/ask')
        .set('X-API-Key', apiKey)
        .send({
          question: 'What is machine learning?',
          content: 'Machine learning is a subset of AI that enables systems to learn from data.'
        });

      // Should get past auth
      expect([200, 500, 503]).toContain(response.status);
    }, 30000);

    it('should reject with invalid API key', async () => {
      const response = await request(app)
        .post('/upload')
        .set('X-API-Key', 'invalid_api_key');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Public Endpoints', () => {
    it('should allow /health without authentication', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should allow /formats without authentication', async () => {
      const response = await request(app)
        .get('/formats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should allow all /auth/* endpoints without authentication', async () => {
      const endpoints = [
        { method: 'post', path: '/auth/login', body: { email: 'test@test.com', password: 'pass' } },
        { method: 'post', path: '/auth/register', body: { email: 'new@test.com', username: 'new', password: 'Pass123!' } },
        { method: 'get', path: '/auth/password-requirements' }
      ];

      for (const endpoint of endpoints) {
        const req = request(app)[endpoint.method](endpoint.path);
        if (endpoint.body) {
          req.send(endpoint.body);
        }
        const response = await req;
        
        // Should not return 401 Unauthorized (may return other errors like 409, 400, etc.)
        expect(response.status).not.toBe(401);
      }
    });
  });

  describe('Security Headers', () => {
    it('should include Helmet security headers', async () => {
      const response = await request(app)
        .get('/health');

      // Helmet adds these headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/health');

      // Rate limiting headers
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });
});
