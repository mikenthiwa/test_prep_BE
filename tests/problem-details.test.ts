import { describe, expect, test } from 'vitest';
import {
    createProblemDetails,
    PROBLEM_JSON_CONTENT_TYPE,
} from '../src/problem-details.ts';

describe('createProblemDetails', () => {
    test.each([
        [400, 'Bad Request'],
        [404, 'Not Found'],
        [500, 'Internal Server Error'],
    ])('creates a generic problem for HTTP %i', (status, title) => {
        expect(createProblemDetails(status)).toEqual({
            type: 'about:blank',
            title,
            status,
        });
    });

    test('includes a supplied public detail', () => {
        expect(createProblemDetails(404, 'Employee not found')).toEqual({
            type: 'about:blank',
            title: 'Not Found',
            status: 404,
            detail: 'Employee not found',
        });
    });

    test('includes optional request context without requiring detail', () => {
        expect(createProblemDetails(404, undefined, {
            instance: '/employees/123',
            requestId: 'request-123',
        })).toEqual({
            type: 'about:blank',
            title: 'Not Found',
            status: 404,
            instance: '/employees/123',
            requestId: 'request-123',
        });
    });

    test.each([200, 399, 499, 600, 400.5])(
        'rejects unsupported status %s',
        (status) => {
            expect(() => createProblemDetails(status)).toThrow(RangeError);
        },
    );
});

test('exports the Problem Details JSON media type', () => {
    expect(PROBLEM_JSON_CONTENT_TYPE).toBe('application/problem+json');
});
