import { Server } from 'socket.io';
import UserModel from '@server/models/user.model';
import { startStatusUpdateJob } from '@server/jobs/statusUpdater.job';

// Create a minimal socket.io mock that only tracks emit calls
const mockIo = {
  emit: jest.fn(),
} as unknown as Server;

describe('startStatusUpdateJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a no-op cleanup function in test environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const stop = startStatusUpdateJob(mockIo);
    jest.advanceTimersByTime(120_000);

    expect(UserModel.updateMany).not.toHaveBeenCalled();
    stop();

    process.env.NODE_ENV = originalEnv;
  });

  it('does not emit statusChanged if no users become inactive', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    jest.spyOn(UserModel, 'updateMany').mockResolvedValue({ modifiedCount: 0 } as Awaited<ReturnType<typeof UserModel.updateMany>>);
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof UserModel.find>);

    const stop = startStatusUpdateJob(mockIo);
    await jest.advanceTimersByTimeAsync(60_001);

    expect(mockIo.emit).not.toHaveBeenCalled();

    stop();
    process.env.NODE_ENV = originalEnv;
  });

  it('emits statusChanged for each newly inactive user', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    jest.spyOn(UserModel, 'updateMany').mockResolvedValue({ modifiedCount: 2 } as Awaited<ReturnType<typeof UserModel.updateMany>>);
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { username: 'alice', status: 'INACTIVE' },
        { username: 'bob',   status: 'INACTIVE' },
      ]),
    } as unknown as ReturnType<typeof UserModel.find>);

    const stop = startStatusUpdateJob(mockIo);
    await jest.advanceTimersByTimeAsync(60_001);

    expect(mockIo.emit).toHaveBeenCalledTimes(2);
    expect(mockIo.emit).toHaveBeenCalledWith('statusChanged', expect.objectContaining({
      username: 'alice',
      status: 'INACTIVE',
    }));

    stop();
    process.env.NODE_ENV = originalEnv;
  });

  it('cleanup function stops the interval', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    jest.spyOn(UserModel, 'updateMany').mockResolvedValue({ modifiedCount: 0 } as Awaited<ReturnType<typeof UserModel.updateMany>>);
    jest.spyOn(UserModel, 'find').mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof UserModel.find>);

    const stop = startStatusUpdateJob(mockIo);
    stop();

    // Advance past one tick — the interval should NOT fire
    await jest.advanceTimersByTimeAsync(120_001);
    expect(UserModel.updateMany).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });
});
