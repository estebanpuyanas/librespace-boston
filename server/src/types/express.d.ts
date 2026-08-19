// Augment Express Request with fields set by authMiddleware
declare namespace Express {
  interface Request {
    username?: string;
    userId?: string;
    role?: 'USER' | 'ADMIN' | 'MODERATOR';
  }
}
