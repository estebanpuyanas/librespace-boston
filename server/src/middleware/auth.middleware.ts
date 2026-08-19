import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

interface JwtPayload {
  username: string;
  id: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
}

// Validates Bearer token and attaches decoded fields to req (see src/types/express.d.ts)
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.username = payload.username;
    req.userId = payload.id;
    req.role = payload.role;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Factory for role-based access control — use as additional middleware on specific routes
export const requireRole = (...roles: Array<'USER' | 'ADMIN' | 'MODERATOR'>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.role || !roles.includes(req.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
