import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { app } from '../src/app.ts';

describe('GET /', () => {
  test('returns the existing greeting', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello World!');
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});
