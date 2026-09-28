import mongoose from 'mongoose';
import { logger } from '../infrastructure/logging.js';

let hasConnected = false;

mongoose.connection.on('connected', () => {
  hasConnected = true;
  logger.info('MongoDB connected');
});
mongoose.connection.on('disconnected', () =>
  logger.warn('MongoDB disconnected')
);
mongoose.connection.on('error', (error: unknown) => {
  if (hasConnected) {
    logger.error(
      { reason: classifyConnectionError(error) },
      'MongoDB connection error'
    );
  }
});

export type ConnectionFailureReason =
  | 'missing_uri'
  | 'invalid_uri'
  | 'authentication_failed'
  | 'server_unavailable'
  | 'connection_failed';

export function classifyConnectionError(
  error: unknown
): ConnectionFailureReason {
  if (error instanceof Error && error.message === 'MONGODB_URI is required') {
    return 'missing_uri';
  }
  if (error instanceof Error && error.name === 'MongoParseError') {
    return 'invalid_uri';
  }
  if (error instanceof mongoose.mongo.MongoServerError && error.code === 18) {
    return 'authentication_failed';
  }
  if (
    error instanceof mongoose.Error.MongooseServerSelectionError ||
    (error instanceof Error && error.name === 'MongoServerSelectionError')
  ) {
    return 'server_unavailable';
  }
  return 'connection_failed';
}

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(uri);
}
