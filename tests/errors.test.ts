import { Writable } from 'node:stream';
import express from 'express';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';
import type { Request, Response } from 'express';
import { app } from '../src/app.ts';
import { errorHandler, HttpError } from '../src/errors.ts';
import { createHttpLogger } from '../src/logging.ts';

function createErrorTestApp(handler: (app: express.Express) => void) {
    const lines: string[] = [];
    const stream = new Writable({
        write(chunk, _encoding, callback) {
            lines.push(chunk.toString());
            callback();
        },
    });
    const logger = pino({ level: 'info', base: null }, stream);
    const testApp = express();
    testApp.use(createHttpLogger(logger));
    handler(testApp);
    testApp.use(errorHandler);

    return {
        app: testApp,
        logs: () => lines.flatMap((line) => line.trim().split('\n')).map((line) => JSON.parse(line)),
    };
}

describe('global Problem Details handler', () => {
    test('rejects unsupported deliberate HTTP error statuses', () => {
        expect(() => new HttpError(200)).toThrow(RangeError);
        expect(() => new HttpError(499)).toThrow(RangeError);
    });

    test('returns a Problem Details 404 for an unknown route', async () => {
        const response = await request(app).get('/missing?token=private');

        expect(response.status).toBe(404);
        expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
        expect(response.body).toEqual({
            type: 'about:blank',
            title: 'Not Found',
            status: 404,
            detail: 'The requested resource /missing was not found.',
        });
        expect(response.text).not.toContain('private');
    });

    test('returns a safe 400 for malformed JSON', async () => {
        const response = await request(app)
            .post('/')
            .set('Content-Type', 'application/json')
            .send('{ invalid json');

        expect(response.status).toBe(400);
        expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
        expect(response.body).toEqual({
            type: 'about:blank',
            title: 'Bad Request',
            status: 400,
            detail: 'Malformed JSON request body.',
        });
        expect(response.text).not.toContain('SyntaxError');
    });

    test('preserves the JSON parser 413 for an oversized body', async () => {
        const response = await request(app).post('/').send({ data: 'x'.repeat(110_000) });

        expect(response.status).toBe(413);
        expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
        expect(response.body).toEqual({
            type: 'about:blank',
            title: 'Payload Too Large',
            status: 413,
            detail: 'JSON request body is too large.',
        });
    });

    test('uses the public detail of a deliberate HTTP error', async () => {
        const fixture = createErrorTestApp((testApp) => {
            testApp.get('/expected', () => {
                throw new HttpError(409, 'Employee number already exists.');
            });
        });

        const response = await request(fixture.app).get('/expected');

        expect(response.status).toBe(409);
        expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
        expect(response.body).toEqual({
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: 'Employee number already exists.',
        });
        expect(fixture.logs()).toEqual([
            expect.objectContaining({
                level: 40,
                reqId: response.headers['x-request-id'],
                statusCode: 409,
            }),
        ]);
    });

    test.each(['sync', 'async'])('hides and logs an unexpected %s error', async (kind) => {
        const fixture = createErrorTestApp((testApp) => {
            if (kind === 'sync') {
                testApp.get('/unexpected', () => {
                    throw new Error('internal secret');
                });
            } else {
                testApp.get('/unexpected', async () => {
                    throw new Error('internal secret');
                });
            }
        });

        const response = await request(fixture.app).get('/unexpected');

        expect(response.status).toBe(500);
        expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
        expect(response.body).toEqual({
            type: 'about:blank',
            title: 'Internal Server Error',
            status: 500,
        });
        expect(response.text).not.toContain('internal secret');
        expect(fixture.logs()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    level: 50,
                    reqId: response.headers['x-request-id'],
                    err: expect.objectContaining({ message: 'internal secret' }),
                }),
                expect.objectContaining({
                    level: 50,
                    reqId: response.headers['x-request-id'],
                    statusCode: 500,
                }),
            ]),
        );
        expect(fixture.logs()).toHaveLength(2);
    });

    test('delegates an error after headers have been sent', () => {
        const error = new Error('late failure');
        const next = vi.fn();
        const response = { headersSent: true } as Response;

        errorHandler(error, {} as Request, response, next);

        expect(next).toHaveBeenCalledOnce();
        expect(next).toHaveBeenCalledWith(error);
    });
});
