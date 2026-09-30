import mongoose from 'mongoose';
import { describe, expect, test } from 'vitest';
import { classifyConnectionError } from '../src/persistence/database.ts';

describe('classifyConnectionError', () => {
  test('classifies an unreachable server', () => {
    expect(
      classifyConnectionError(
        new mongoose.Error.MongooseServerSelectionError('unreachable')
      )
    ).toBe('server_unavailable');
  });
});
