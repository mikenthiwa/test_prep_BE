import mongoose from 'mongoose';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { logger } from '../src/infrastructure/logging.ts';
import { connectDatabase } from '../src/persistence/database.ts';
import { useMongoMemoryServer } from './support/mongo.ts';

describe('connectDatabase', () => {
  const mongo = useMongoMemoryServer();

  afterEach(async () => {
    await mongoose.disconnect();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test('connects using MONGODB_URI and logs connection changes', async () => {
    vi.stubEnv('MONGODB_URI', mongo.uri);
    const connectedLog = vi
      .spyOn(logger, 'info')
      .mockImplementation(() => logger);
    const disconnectedLog = vi
      .spyOn(logger, 'warn')
      .mockImplementation(() => logger);

    await connectDatabase();
    expect(mongoose.connection.readyState).toBe(1);
    expect(connectedLog).toHaveBeenCalledWith('MongoDB connected');

    await mongoose.disconnect();
    expect(disconnectedLog).toHaveBeenCalledWith('MongoDB disconnected');
  });

  test('rejects a missing URI', async () => {
    vi.stubEnv('MONGODB_URI', undefined);
    await expect(connectDatabase()).rejects.toThrow('MONGODB_URI is required');
  });

  test('propagates an invalid URI error', async () => {
    vi.stubEnv('MONGODB_URI', 'not-a-mongodb-uri');
    await expect(connectDatabase()).rejects.toThrow();
  });

  test('logs a safe reason for a connection error after startup', async () => {
    vi.stubEnv('MONGODB_URI', mongo.uri);
    await connectDatabase();
    const errorLog = vi.spyOn(logger, 'error').mockImplementation(() => logger);

    mongoose.connection.emit('error', new Error('secret connection detail'));

    expect(errorLog).toHaveBeenCalledWith(
      { reason: 'connection_failed' },
      'MongoDB connection error'
    );
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain(
      'secret connection detail'
    );
  });
});
