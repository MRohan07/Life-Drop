import { describe, it, expect, beforeEach } from 'vitest';
import { request, clearTestDatabase } from './helpers.js';
import { prisma } from '../src/config/database.js';
import { verifyPassword, hashPassword } from '../src/common/utils/security.js';

describe('Authentication & Security Integration Tests', () => {
  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('User Registration & Password Hashing', () => {
    it('should register a new donor with Argon2id password hash', async () => {
      const res = await request
        .post('/api/v1/auth/register')
        .send({
          phone: '+919876543210',
          password: 'SecurePassword123!',
          name: 'Jane Doe',
          role: 'USER',
          bloodGroup: 'O_POS',
          city: 'Guntur',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Verify Argon2id hash in database
      const dbUser = await prisma.user.findUnique({
        where: { phone: '+919876543210' },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.passwordHash).toBeDefined();
      expect(dbUser?.passwordHash).not.toBe('SecurePassword123!');

      // Verify password verification succeeds with correct password
      const isMatch = await verifyPassword(dbUser!.passwordHash!, 'SecurePassword123!');
      expect(isMatch).toBe(true);
    });

    it('should reject duplicate phone registration', async () => {
      await request.post('/api/v1/auth/register').send({
        phone: '+919876543210',
        password: 'Password123!',
        name: 'First User',
        city: 'Guntur',
        role: 'USER',
      });

      const res = await request.post('/api/v1/auth/register').send({
        phone: '+919876543210',
        password: 'Password123!',
        name: 'Second User',
        city: 'Guntur',
        role: 'USER',
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('Login & Password Verification', () => {
    beforeEach(async () => {
      await request.post('/api/v1/auth/register').send({
        phone: '+919876543210',
        password: 'MySecretPassword123!',
        name: 'Test Donor',
        city: 'Guntur',
        role: 'USER',
      });
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request.post('/api/v1/auth/login').send({
        identifier: '+919876543210',
        password: 'MySecretPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const res = await request.post('/api/v1/auth/login').send({
        identifier: '+919876543210',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid password');
    });

    it('should authenticate predefined administrator accounts (Rohan & Hanitha) with Argon2id', async () => {
      const adminHash = await hashPassword('Admin@123');
      await prisma.user.createMany({
        data: [
          {
            name: 'Rohan (Administrator)',
            email: 'adminrohan@gmail.com',
            phone: '+919888800001',
            role: 'ADMIN',
            passwordHash: adminHash,
            status: 'ACTIVE',
          },
          {
            name: 'Hanitha (Administrator)',
            email: 'adminhanitha@gmail.com',
            phone: '+919888800002',
            role: 'ADMIN',
            passwordHash: adminHash,
            status: 'ACTIVE',
          },
        ],
      });

      // Test Rohan login
      const resRohan = await request.post('/api/v1/auth/login').send({
        identifier: 'adminrohan@gmail.com',
        password: 'Admin@123',
      });
      expect(resRohan.status).toBe(200);
      expect(resRohan.body.data.user.role).toBe('ADMIN');
      expect(resRohan.body.data.user.email).toBe('adminrohan@gmail.com');
      expect(resRohan.body.data.accessToken).toBeDefined();

      // Test Hanitha login
      const resHanitha = await request.post('/api/v1/auth/login').send({
        identifier: 'adminhanitha@gmail.com',
        password: 'Admin@123',
      });
      expect(resHanitha.status).toBe(200);
      expect(resHanitha.body.data.user.role).toBe('ADMIN');
      expect(resHanitha.body.data.user.email).toBe('adminhanitha@gmail.com');
      expect(resHanitha.body.data.accessToken).toBeDefined();

      // Test wrong password rejection
      const resBad = await request.post('/api/v1/auth/login').send({
        identifier: 'adminrohan@gmail.com',
        password: 'WrongAdminPassword',
      });
      expect(resBad.status).toBe(401);
    });
  });

  describe('Refresh Token Rotation & Revocation', () => {
    it('should rotate refresh token and revoke the previous session', async () => {
      const reg = await request.post('/api/v1/auth/register').send({
        phone: '+919876543210',
        password: 'Password123!',
        name: 'Session User',
        city: 'Guntur',
        role: 'USER',
      });

      const initialRefreshToken = reg.body.data.refreshToken;
      expect(initialRefreshToken).toBeDefined();

      // Refresh session
      const refreshRes = await request.post('/api/v1/auth/refresh').send({
        refreshToken: initialRefreshToken,
      });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).not.toBe(initialRefreshToken);

      // Attempting to reuse the revoked old refresh token should fail
      const reuseRes = await request.post('/api/v1/auth/refresh').send({
        refreshToken: initialRefreshToken,
      });

      expect(reuseRes.status).toBe(401);
    });

    it('should revoke session on logout', async () => {
      const reg = await request.post('/api/v1/auth/register').send({
        phone: '+919876543210',
        password: 'Password123!',
        name: 'Logout User',
        city: 'Guntur',
        role: 'USER',
      });

      const refreshToken = reg.body.data.refreshToken;

      const logoutRes = await request.post('/api/v1/auth/logout').send({
        refreshToken,
      });

      expect(logoutRes.status).toBe(200);

      // Refresh after logout should fail
      const refreshRes = await request.post('/api/v1/auth/refresh').send({
        refreshToken,
      });

      expect(refreshRes.status).toBe(401);
    });
  });

  describe('OTP Challenge & Attempt Limits', () => {
    it('should generate an OTP challenge and reject incorrect code', async () => {
      const otpReq = await request.post('/api/v1/auth/otp/request').send({
        phone: '+919876543210',
        purpose: 'LOGIN',
      });

      expect(otpReq.status).toBe(200);
      expect(otpReq.body.data.devCode).toBeDefined();

      // Submit wrong code
      const verifyRes = await request.post('/api/v1/auth/otp/verify').send({
        phone: '+919876543210',
        code: '000000',
      });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.message).toContain('Incorrect OTP');
    });
  });
});
