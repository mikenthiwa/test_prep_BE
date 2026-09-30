import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';
import { app } from '../src/app.ts';
import { connectDatabase } from '../src/persistence/database.ts';

describe('GET /health/ready', () => {
  test('reports not ready, ready, then recovers from a MongoDB outage', async () => {
    const mongo = await MongoMemoryServer.create();
    try {
      const uri = new URL(mongo.getUri());
      uri.searchParams.set('heartbeatFrequencyMS', '1000');
      vi.stubEnv('MONGODB_URI', uri.toString());

      const beforeConnection = await request(app).get(
        '/health/ready?token=private'
      );
      expectNotReady(beforeConnection);

      await connectDatabase();
      const connected = await request(app).get('/health/ready');
      expect(connected.status).toBe(200);
      expect(connected.body).toEqual({ status: 'ready' });
      expect(connected.headers['cache-control']).toBe('no-store');
      expect(connected.headers['content-type']).toMatch(/^application\/json/);

      await mongo.stop({ doCleanup: false });
      await expect
        .poll(async () => (await request(app).get('/health/ready')).status, {
          interval: 250,
          timeout: 20_000,
        })
        .toBe(503);
      const disconnected = await request(app).get('/health/ready');
      expectNotReady(disconnected);

      await mongo.start(true);
      await expect
        .poll(async () => (await request(app).get('/health/ready')).status, {
          interval: 250,
          timeout: 20_000,
        })
        .toBe(200);
      const reconnected = await request(app).get('/health/ready');
      expect(reconnected.status).toBe(200);
      expect(reconnected.body).toEqual({ status: 'ready' });
    } finally {
      vi.unstubAllEnvs();
      try {
        await mongoose.disconnect();
      } finally {
        await mongo.stop();
      }
    }
  }, 50_000);
});

function expectNotReady(response: {
  status: number;
  body: unknown;
  text: string;
  headers: Record<string, string>;
}) {
  expect(response.status).toBe(503);
  expect(response.headers['content-type']).toMatch(
    /^application\/problem\+json/
  );
  expect(response.headers['cache-control']).toBe('no-store');
  expect(response.body).toEqual({
    type: 'about:blank',
    title: 'Service Unavailable',
    status: 503,
    detail: 'MongoDB is unavailable.',
    instance: '/health/ready',
    requestId: response.headers['x-request-id'],
  });
  expect(response.text).not.toContain('private');
}
