import { describe, expect, test } from 'vitest';
import { createProblemDetails } from '../src/problem-details.ts';

describe('createProblemDetails', () => {
  test.each([200, 399, 499, 600, 400.5])(
    'rejects unsupported status %s',
    (status) => {
      expect(() => createProblemDetails(status)).toThrow(RangeError);
    }
  );
});
