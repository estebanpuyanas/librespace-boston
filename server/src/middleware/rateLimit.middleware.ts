import { Request, Response, NextFunction } from 'express';

interface WindowEntry { count: number; resetAt: number }

// In-memory sliding window — replace with Redis for multi-instance deployments
const windows = new Map<string, WindowEntry>();

export const rateLimitMiddleware = (maxRequests = 100, windowMs = 60_000) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.username ?? req.ip}:${req.path}`;
    const now = Date.now();
    const entry = windows.get(key);

    if (!entry || now >= entry.resetAt) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
      return;
    }

    entry.count += 1;
    next();
  };

// Purge expired windows every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of windows.entries()) {
    if (now >= entry.resetAt) windows.delete(key);
  }
}, 5 * 60_000);
