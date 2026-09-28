import { describe, expect, test } from 'vitest';
import { useMongoMemoryServer } from './support/mongo.ts';

describe('MongoDB test fixture', () => {
  const mongo = useMongoMemoryServer();

  test('starts a test server with a connection URI', () => {
    expect(mongo.uri).toMatch(/^mongodb:\/\/127\.0\.0\.1:\d+\//);
  });
});
