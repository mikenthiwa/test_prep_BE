import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { app } from '../src/app.ts';

describe('GET /', () => {
  test('returns Problem Details for the unmatched root path', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(
      /^application\/problem\+json/
    );
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'The requested resource / was not found.',
      instance: '/',
      requestId: response.headers['x-request-id'],
    });
  });
});
