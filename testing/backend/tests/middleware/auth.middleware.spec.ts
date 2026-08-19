import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, requireRole } from '@server/middleware/auth.middleware';

const JWT_SECRET = 'dev-secret';

const makeReq = (authHeader?: string): Partial<Request> => ({
  headers: authHeader ? { authorization: authHeader } : {},
});

const makeRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

const next: NextFunction = jest.fn();

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls next() and attaches claims on a valid Bearer token', () => {
    const token = jwt.sign(
      { username: 'alice', id: 'uid1', role: 'USER' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const req = makeReq(`Bearer ${token}`) as Request & { username?: string; role?: string };
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.username).toBe('alice');
    expect(req.role).toBe('USER');
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is missing', () => {
    const req = makeReq() as Request;
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with Bearer', () => {
    const req = makeReq('Basic sometoken') as Request;
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for an expired token', () => {
    const token = jwt.sign(
      { username: 'alice', id: 'uid1', role: 'USER' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const req = makeReq(`Bearer ${token}`) as Request;
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a token signed with the wrong secret', () => {
    const token = jwt.sign({ username: 'alice', id: 'uid1', role: 'USER' }, 'wrong-secret');
    const req = makeReq(`Bearer ${token}`) as Request;
    const res = makeRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('requireRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls next() when user has a required role', () => {
    const req = { role: 'ADMIN' } as Request & { role?: string };
    const res = makeRes();

    requireRole('ADMIN')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when user does not have a required role', () => {
    const req = { role: 'USER' } as Request & { role?: string };
    const res = makeRes();

    requireRole('ADMIN')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts any of multiple allowed roles', () => {
    const req = { role: 'MODERATOR' } as Request & { role?: string };
    const res = makeRes();

    requireRole('ADMIN', 'MODERATOR')(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
