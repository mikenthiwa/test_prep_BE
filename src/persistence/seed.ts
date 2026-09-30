import mongoose from 'mongoose';
import {
  DemoSeedError,
  seedDemoAccounts,
  seedOptionsFromEnv,
} from './seed-demo-accounts.js';
import { logger } from '../infrastructure/logging.js';
import { connectDatabase } from './database.js';

try {
  const options = seedOptionsFromEnv(process.env);
  await connectDatabase();
  await seedDemoAccounts(options);
  logger.info('Demo accounts seeded');
} catch (error) {
  logger.error(
    { reason: error instanceof DemoSeedError ? error.reason : 'seed_failed' },
    'Demo account seeding failed'
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
