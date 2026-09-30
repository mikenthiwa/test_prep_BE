import { Writable } from 'node:stream';
import express from 'express';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { app } from '../../app.ts';
import { loginRequestSchema } from './command/login-handler.ts';
import { createLoginRouter } from './login.ts';
import { errorHandler } from '../../infrastructure/errors.ts';
import { createHttpLogger } from '../../infrastructure/logging.ts';

function createTestApp() {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/v1', createLoginRouter());
  testApp.use(errorHandler);
  return testApp;
}

describe('POST /api/v1/auth/login', () => {
  test.each([
    {},
    { email: 42, password: 42 },
    { email: 'invalid', password: 'secret' },
    { email: 'a@example.com', password: '' },
    { email: 'a@example.com', password: 'secret', role: 'admin' },
    { email: 'a@example.com', password: 'secret', employer: 'private' },
  ])('rejects invalid input safely: %j', async (body) => {
    const response = await request(createTestApp())
      .post('/api/v1/auth/login?token=private')
      .send(body);

    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual({
      success: false,
      status: 400,
      message: 'Sorry, something went wrong.',
    });
    expect(response.text).not.toContain('secret');
    expect(response.text).not.toContain('private');
  });

  test('normalizes email while preserving the password', () => {
    expect(
      loginRequestSchema.parse({
        email: '  ADMIN@Example.COM  ',
        password: ' secret ',
      })
    ).toEqual({
      email: 'admin@example.com',
      password: ' secret ',
    });
  });

  test('leaves the unversioned login path unmatched', async () => {
    expect((await request(app).post('/api/auth/login').send({})).status).toBe(
      404
    );
  });

  test('does not log submitted credentials', async () => {
    const lines: string[] = [];
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        lines.push(chunk.toString());
        callback();
      },
    });
    const testApp = express();
    testApp.use(createHttpLogger(pino({ level: 'info', base: null }, stream)));
    testApp.use(express.json());
    testApp.use('/api/v1', createLoginRouter());
    testApp.use(errorHandler);

    const password = 'secret-password-value';
    await request(testApp).post('/api/v1/auth/login?token=private').send({
      email: 'invalid',
      password,
    });

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]!)).toMatchObject({
      method: 'POST',
      path: '/api/v1/auth/login',
      statusCode: 400,
    });
    expect(lines.join('')).not.toContain(password);
    expect(lines.join('')).not.toContain('private');
  });
});
