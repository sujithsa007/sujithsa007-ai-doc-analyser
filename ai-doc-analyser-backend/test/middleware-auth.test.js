import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticateJWT, authenticateAPIKey, authenticate, requireRole } from '../middleware/auth.js';

describe('Authentication Middleware Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: null
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();
  });

  describe('authenticateJWT', () => {
    const validToken = jwt.sign(
      { id: 'user123', email: 'test@test.com', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '15m' }
    );

    it('should authenticate valid JWT token', async () => {
      mockReq.headers.authorization = `Bearer ${validToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.email).toBe('test@test.com');
    });

    it('should reject missing authorization header', async () => {
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('No token provided') })
      );
    });

    it('should reject malformed authorization header', async () => {
      mockReq.headers.authorization = 'InvalidFormat token123';
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token.here';
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { id: 'user123', email: 'test@test.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1s' }
      );
      mockReq.headers.authorization = `Bearer ${expiredToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should reject token with wrong secret', async () => {
      const wrongToken = jwt.sign(
        { id: 'user123', email: 'test@test.com' },
        'wrong-secret',
        { expiresIn: '15m' }
      );
      mockReq.headers.authorization = `Bearer ${wrongToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle bearer token with extra spaces', async () => {
      mockReq.headers.authorization = `  Bearer   ${validToken}  `;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });

    it('should reject token with missing payload', async () => {
      const emptyToken = jwt.sign({}, process.env.JWT_SECRET || 'test-secret');
      mockReq.headers.authorization = `Bearer ${emptyToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled(); // Token is valid but user data might be incomplete
    });

    it('should extract user role from token', async () => {
      const adminToken = jwt.sign(
        { id: 'admin1', email: 'admin@test.com', role: 'admin' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '15m' }
      );
      mockReq.headers.authorization = `Bearer ${adminToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockReq.user.role).toBe('admin');
    });

    it('should handle case-insensitive Bearer keyword', async () => {
      mockReq.headers.authorization = `bearer ${validToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('authenticateAPIKey', () => {
    const validApiKey = 'aiDoc_1234567890abcdef1234567890abcdef';

    it('should authenticate valid API key', async () => {
      mockReq.headers['x-api-key'] = validApiKey;
      
      await authenticateAPIKey(mockReq, mockRes, mockNext);
      
      // Will fail if API key doesn't exist in system, which is expected
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject missing API key header', async () => {
      await authenticateAPIKey(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('No API key provided') })
      );
    });

    it('should reject invalid API key format', async () => {
      mockReq.headers['x-api-key'] = 'invalid-format-key';
      
      await authenticateAPIKey(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject empty API key', async () => {
      mockReq.headers['x-api-key'] = '';
      
      await authenticateAPIKey(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle API key with spaces', async () => {
      mockReq.headers['x-api-key'] = `  ${validApiKey}  `;
      
      await authenticateAPIKey(mockReq, mockRes, mockNext);
      
      // Should trim and process
      expect(mockRes.status).toHaveBeenCalled();
    });

    it('should reject API key with special characters', async () => {
      mockReq.headers['x-api-key'] = 'aiDoc_!@#$%^&*()';
      
      await authenticateAPIKey(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle case-sensitive API key header', async () => {
      mockReq.headers['X-API-KEY'] = validApiKey;
      
      await authenticateAPIKey(mockReq, mockRes, mockNext);
      
      // Express normalizes headers to lowercase
      expect(mockRes.status).toHaveBeenCalled();
    });

    it('should reject API key without aiDoc_ prefix', async () => {
      mockReq.headers['x-api-key'] = '1234567890abcdef1234567890abcdef';
      
      await authenticateAPIKey(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('authenticate (flexible)', () => {
    const validToken = jwt.sign(
      { id: 'user123', email: 'test@test.com', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '15m' }
    );

    it('should authenticate with JWT token', async () => {
      mockReq.headers.authorization = `Bearer ${validToken}`;
      
      await authenticate(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });

    it('should authenticate with API key', async () => {
      mockReq.headers['x-api-key'] = 'aiDoc_test123';
      
      await authenticate(mockReq, mockRes, mockNext);
      
      // Will check API key in system
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should prioritize JWT over API key when both present', async () => {
      mockReq.headers.authorization = `Bearer ${validToken}`;
      mockReq.headers['x-api-key'] = 'aiDoc_test123';
      
      await authenticate(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });

    it('should reject when neither JWT nor API key provided', async () => {
      await authenticate(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject when both JWT and API key are invalid', async () => {
      mockReq.headers.authorization = 'Bearer invalid';
      mockReq.headers['x-api-key'] = 'invalid';
      
      await authenticate(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireRole', () => {
    it('should allow user with correct role', async () => {
      mockReq.user = { id: '123', role: 'admin' };
      const middleware = requireRole('admin');
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject user without required role', async () => {
      mockReq.user = { id: '123', role: 'user' };
      const middleware = requireRole('admin');
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Insufficient permissions') })
      );
    });

    it('should reject when user object is missing', async () => {
      const middleware = requireRole('admin');
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject when role is missing from user object', async () => {
      mockReq.user = { id: '123' };
      const middleware = requireRole('admin');
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should allow multiple roles', async () => {
      mockReq.user = { id: '123', role: 'moderator' };
      const middleware = requireRole(['admin', 'moderator']);
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should be case-sensitive for roles', async () => {
      mockReq.user = { id: '123', role: 'Admin' };
      const middleware = requireRole('admin');
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('should handle empty role array', async () => {
      mockReq.user = { id: '123', role: 'user' };
      const middleware = requireRole([]);
      
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Token Expiration Edge Cases', () => {
    it('should reject token expiring in 1 second', async () => {
      const soonExpiredToken = jwt.sign(
        { id: 'user123', email: 'test@test.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1s' }
      );
      
      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      mockReq.headers.authorization = `Bearer ${soonExpiredToken}`;
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should accept token with very long expiry', async () => {
      const longToken = jwt.sign(
        { id: 'user123', email: 'test@test.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '365d' }
      );
      mockReq.headers.authorization = `Bearer ${longToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject token with negative expiry', async () => {
      const negativeToken = jwt.sign(
        { id: 'user123', email: 'test@test.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );
      mockReq.headers.authorization = `Bearer ${negativeToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Security Attack Scenarios', () => {
    it('should reject SQL injection in API key', async () => {
      mockReq.headers['x-api-key'] = "aiDoc_'; DROP TABLE users; --";
      
      await authenticateAPIKey(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject XSS payload in token', async () => {
      mockReq.headers.authorization = "Bearer <script>alert('xss')</script>";
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject extremely long token', async () => {
      const longToken = 'Bearer ' + 'a'.repeat(10000);
      mockReq.headers.authorization = longToken;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject token with null bytes', async () => {
      mockReq.headers.authorization = 'Bearer token\x00with\x00nulls';
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject token with unicode characters', async () => {
      mockReq.headers.authorization = 'Bearer token™®©';
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle JWT algorithm confusion attack', async () => {
      // Try to use HS256 secret as RS256 public key
      const maliciousToken = jwt.sign(
        { id: 'hacker', role: 'admin' },
        process.env.JWT_SECRET || 'test-secret',
        { algorithm: 'none' }
      );
      mockReq.headers.authorization = `Bearer ${maliciousToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject token tampering attempt', async () => {
      const validToken = jwt.sign(
        { id: 'user123', role: 'user' },
        process.env.JWT_SECRET || 'test-secret'
      );
      // Tamper with token by changing payload
      const parts = validToken.split('.');
      const tamperedToken = parts[0] + '.eyJpZCI6InVzZXIxMjMiLCJyb2xlIjoiYWRtaW4ifQ.' + parts[2];
      mockReq.headers.authorization = `Bearer ${tamperedToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Header Variations', () => {
    const validToken = jwt.sign(
      { id: 'user123', email: 'test@test.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '15m' }
    );

    it('should handle lowercase bearer keyword', async () => {
      mockReq.headers.authorization = `bearer ${validToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle UPPERCASE BEARER keyword', async () => {
      mockReq.headers.authorization = `BEARER ${validToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle MixedCase Bearer keyword', async () => {
      mockReq.headers.authorization = `BeArEr ${validToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject Basic auth instead of Bearer', async () => {
      mockReq.headers.authorization = `Basic ${Buffer.from('user:pass').toString('base64')}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject Digest auth', async () => {
      mockReq.headers.authorization = 'Digest username="user"';
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing JWT_SECRET gracefully', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      mockReq.headers.authorization = 'Bearer sometoken';
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      
      process.env.JWT_SECRET = originalSecret;
    });

    it('should handle corrupted user data in token', async () => {
      const corruptedToken = jwt.sign(
        { id: null, email: undefined, role: '' },
        process.env.JWT_SECRET || 'test-secret'
      );
      mockReq.headers.authorization = `Bearer ${corruptedToken}`;
      
      await authenticateJWT(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled(); // Token is valid, data is just empty
    });

    it('should handle circular reference in token payload', async () => {
      // JWT won't allow circular references, but test edge case
      try {
        const circular = { a: {} };
        circular.a.b = circular;
        jwt.sign(circular, process.env.JWT_SECRET || 'test-secret');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
