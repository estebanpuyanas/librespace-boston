import supertest from 'supertest';
import app from '@server/app';
import * as authService from '@server/services/auth.service';
import { mockSafeUser1 } from '../mockData.models';

// Create spies at module level so they're shared across all describe blocks
const loginUserSpy = jest.spyOn(authService, 'loginUser');
const registerUserSpy = jest.spyOn(authService, 'registerUser');

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- POST /api/auth/login ----

  describe('POST /api/auth/login', () => {
    it('returns 200 with token and safe user on valid credentials', async () => {
      loginUserSpy.mockResolvedValueOnce({ token: 'jwt.token.here', user: mockSafeUser1 });

      const response = await supertest(app)
        .post('/api/auth/login')
        .send({ username: 'alice', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('jwt.token.here');
      expect(response.body.user.username).toBe('alice');
      expect(response.body.user.password).toBeUndefined();
      expect(loginUserSpy).toHaveBeenCalledWith('alice', 'password123');
    });

    it('returns 400 if username is missing', async () => {
      const response = await supertest(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(loginUserSpy).not.toHaveBeenCalled();
    });

    it('returns 400 if password is missing', async () => {
      const response = await supertest(app)
        .post('/api/auth/login')
        .send({ username: 'alice' });

      expect(response.status).toBe(400);
      expect(loginUserSpy).not.toHaveBeenCalled();
    });

    it('returns 401 on invalid credentials', async () => {
      loginUserSpy.mockRejectedValueOnce(new Error('Invalid credentials'));

      const response = await supertest(app)
        .post('/api/auth/login')
        .send({ username: 'alice', password: 'wrongpass' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('does not return password in response', async () => {
      loginUserSpy.mockResolvedValueOnce({ token: 'tok', user: mockSafeUser1 });

      const response = await supertest(app)
        .post('/api/auth/login')
        .send({ username: 'alice', password: 'password123' });

      expect(response.body.user).not.toHaveProperty('password');
    });
  });

  // ---- POST /api/auth/register ----

  describe('POST /api/auth/register', () => {
    it('returns 201 with token and user on successful registration', async () => {
      registerUserSpy.mockResolvedValueOnce({ token: 'new.jwt.token', user: mockSafeUser1 });

      const response = await supertest(app)
        .post('/api/auth/register')
        .send({ username: 'alice', email: 'alice@example.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body.token).toBe('new.jwt.token');
      expect(registerUserSpy).toHaveBeenCalledWith('alice', 'alice@example.com', 'password123');
    });

    it('returns 400 if email is missing', async () => {
      const response = await supertest(app)
        .post('/api/auth/register')
        .send({ username: 'alice', password: 'password123' });

      expect(response.status).toBe(400);
      expect(registerUserSpy).not.toHaveBeenCalled();
    });

    it('returns 400 if username is already taken', async () => {
      registerUserSpy.mockRejectedValueOnce(new Error('Username or email already in use'));

      const response = await supertest(app)
        .post('/api/auth/register')
        .send({ username: 'alice', email: 'alice@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username or email already in use');
    });
  });

  // ---- POST /api/auth/logout ----

  describe('POST /api/auth/logout', () => {
    it('returns 200 with a message', async () => {
      const response = await supertest(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out');
    });
  });
});
