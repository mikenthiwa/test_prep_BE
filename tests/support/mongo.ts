import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll } from 'vitest';

export function useMongoMemoryServer() {
  let server: MongoMemoryServer | undefined;

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    await server?.stop();
  });

  return {
    get uri(): string {
      if (!server) {
        throw new Error('MongoDB test server has not started');
      }

      return server.getUri();
    },
  };
}
