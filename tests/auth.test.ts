/// <reference types="jest" />

import { generateToken, verifyToken, generateDemoToken, authenticateToken } from '../src/auth/jwt';
import { Request, Response } from 'express';

describe('JWT Authentication', () => {
  describe('authenticateToken middleware', () => {
    it('should call next() with valid token', () => {
      const payload = { userId: 'test-user', role: 'user' };
      const token = generateToken(payload);
      
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      } as Request;
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;
      
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token is provided', () => {
      const req = {
        headers: {}
      } as Request;
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;
      
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for invalid token', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      } as Request;
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;
      
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate a valid token', () => {
      const payload = { userId: 'test-user', role: 'user' };
      const token = generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate token with custom payload', () => {
      const payload = { userId: 'admin-user', role: 'admin' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('admin-user');
      expect(decoded?.role).toBe('admin');
    });

    it('should sanitize userId with special characters', () => {
      const payload = { userId: '<script>alert("xss")</script>test', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('scriptalert("xss")/scripttest');
      expect(decoded?.userId).not.toContain('<');
      expect(decoded?.userId).not.toContain('>');
    });

    it('should handle userId with whitespace', () => {
      const payload = { userId: '  test-user  ', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('test-user');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { userId: 'test-user', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('test-user');
      expect(decoded?.role).toBe('user');
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const decoded = verifyToken('not.a.token');
      expect(decoded).toBeNull();
    });

    it('should include standard JWT claims', () => {
      const payload = { userId: 'test-user', role: 'user' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded).toHaveProperty('iat'); // issued at
      expect(decoded).toHaveProperty('exp'); // expiration
    });
  });

  describe('generateDemoToken', () => {
    it('should generate demo token with default values', () => {
      const token = generateDemoToken();
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('demo-user');
      expect(decoded?.role).toBe('user');
    });

    it('should generate demo token with custom userId', () => {
      const token = generateDemoToken('custom-user');
      const decoded = verifyToken(token);
      
      expect(decoded?.userId).toBe('custom-user');
    });

    it('should generate demo token with custom role', () => {
      const token = generateDemoToken('admin-user', 'admin');
      const decoded = verifyToken(token);
      
      expect(decoded?.userId).toBe('admin-user');
      expect(decoded?.role).toBe('admin');
    });
  });
});
