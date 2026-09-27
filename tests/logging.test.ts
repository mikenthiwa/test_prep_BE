import { Writable } from 'node:stream';
import express from 'express';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { createHttpLogger } from '../src/infrastructure/logging.ts';

function captureLogs() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  const logger = pino({ level: 'info', base: null }, stream);

  return {
    middleware: createHttpLogger(logger),
    records: () =>
      lines
        .flatMap((line) => line.trim().split('\n'))
        .map((line) => JSON.parse(line)),
    text: () => lines.join(''),
  };
}

function createLoggedApp(middleware: ReturnType<typeof createHttpLogger>) {
  const app = express();
  app.use(middleware);
  app.get('/', (_req, res) => res.send('Hello World!'));
  return app;
}

describe('structured HTTP logging', () => {
  test('logs a successful request and returns its generated ID', async () => {
    const logs = captureLogs();
    const response = await request(createLoggedApp(logs.middleware))
      .get('/?secret=hidden-query-value')
      .set('Authorization', 'Bearer hidden-token')
      .set('X-Request-Id', 'caller-supplied-id');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello World!');
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers['x-request-id']).not.toBe('caller-supplied-id');
    expect(logs.records()).toEqual([
      expect.objectContaining({
        level: 30,
        reqId: response.headers['x-request-id'],
        method: 'GET',
        path: '/',
        statusCode: 200,
        responseTime: expect.any(Number),
      }),
    ]);
    expect(logs.text()).not.toContain('hidden-query-value');
    expect(logs.text()).not.toContain('hidden-token');
    expect(logs.text()).not.toContain('caller-supplied-id');
  });

  test('logs a missing route at warning level with a different ID per request', async () => {
    const logs = captureLogs();
    const app = createLoggedApp(logs.middleware);
    const first = await request(app).get('/missing');
    const second = await request(app).get('/missing');

    expect(first.status).toBe(404);
    expect(first.headers['x-request-id']).not.toBe(
      second.headers['x-request-id']
    );
    expect(logs.records()).toEqual([
      expect.objectContaining({
        level: 40,
        reqId: first.headers['x-request-id'],
        path: '/missing',
        statusCode: 404,
      }),
      expect.objectContaining({
        level: 40,
        reqId: second.headers['x-request-id'],
        path: '/missing',
        statusCode: 404,
      }),
    ]);
  });

  test('logs a 5xx response at error level', async () => {
    const logs = captureLogs();
    const app = express();
    app.use(logs.middleware);
    app.get('/failure', (_req, res) => res.sendStatus(503));

    const response = await request(app).get('/failure');

    expect(logs.records()).toEqual([
      expect.objectContaining({
        level: 50,
        reqId: response.headers['x-request-id'],
        path: '/failure',
        statusCode: 503,
      }),
    ]);
  });
});
