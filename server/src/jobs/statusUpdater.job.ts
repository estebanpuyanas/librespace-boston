import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents } from 'shared/types/socket';
import UserModel from '../models/user.model';

type AppSocket = Server<ClientToServerEvents, ServerToClientEvents>;

const INACTIVE_THRESHOLD_MS = 5 * 60_000;
const JOB_INTERVAL_MS       = 60_000;

// Returns a cleanup function — call it on SIGTERM to stop the interval gracefully.
// Skipped entirely in test environments so tests don't have dangling timers.
export const startStatusUpdateJob = (io: AppSocket): (() => void) => {
  if (process.env.NODE_ENV === 'test') return () => {};

  const interval = setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - INACTIVE_THRESHOLD_MS);

      await UserModel.updateMany(
        { status: 'ACTIVE', lastSeen: { $lt: cutoff } },
        { status: 'INACTIVE' }
      );

      const inactiveUsers = await UserModel
        .find({ status: 'INACTIVE', lastSeen: { $lt: cutoff } })
        .select('username status');

      inactiveUsers.forEach(u => {
        io.emit('statusChanged', {
          username: u.username,
          status: 'INACTIVE',
          timestamp: new Date(),
        });
      });
    } catch (err) {
      console.error('[statusUpdater] Job failed:', err);
    }
  }, JOB_INTERVAL_MS);

  return () => clearInterval(interval);
};
