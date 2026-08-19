import { Request, Response, NextFunction } from 'express';
import UserModel from '../models/user.model';

const THROTTLE_MS = 30_000;
const lastUpdated = new Map<string, number>();

// Non-blocking: fires the DB write and calls next() immediately.
// Throttled per user to avoid a write on every single request.
export const activityTracker = (req: Request, _res: Response, next: NextFunction): void => {
  const username = req.username;
  if (!username) { next(); return; }

  const now = Date.now();
  const last = lastUpdated.get(username) ?? 0;

  if (now - last > THROTTLE_MS) {
    lastUpdated.set(username, now);
    UserModel
      .findOneAndUpdate({ username }, { lastSeen: new Date(), status: 'ACTIVE' })
      .catch(() => {});
  }

  next();
};
