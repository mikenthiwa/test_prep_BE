import mongoose from 'mongoose';
import { describe, expect, test } from 'vitest';
import { classifyConnectionError } from '../src/persistence/database.ts';

describe('classifyConnectionError', () => {
  test('classifies missing and malformed connection settings', () => {
    expect(classifyConnectionError(new Error('MONGODB_URI is required'))).toBe(
      'missing_uri'
    );
    expect(
      classifyConnectionError(new mongoose.mongo.MongoParseError('invalid URI'))
    ).toBe('invalid_uri');
  });

  test('classifies rejected credentials and an unreachable server', () => {
    const authError = new mongoose.mongo.MongoServerError({
      ok: 0,
      code: 18,
      errmsg: 'Authentication failed',
    });
    expect(classifyConnectionError(authError)).toBe('authentication_failed');
    expect(
      classifyConnectionError(
        new mongoose.Error.MongooseServerSelectionError('unreachable')
      )
    ).toBe('server_unavailable');
  });

  test('uses a generic category for unknown failures', () => {
    expect(classifyConnectionError(new Error('unexpected'))).toBe(
      'connection_failed'
    );
    expect(classifyConnectionError(null)).toBe('connection_failed');
  });
});
