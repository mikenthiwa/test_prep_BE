import { app } from './app.js';
import { logger } from './infrastructure/logging.js';
import {
  classifyConnectionError,
  connectDatabase,
} from './persistence/database.js';

const port = process.env.PORT || 4000;

try {
  await connectDatabase();
  app.listen(port, () => {
    logger.info({ port }, `Server is running on port ${port}`);
  });
} catch (error) {
  logger.error(
    { reason: classifyConnectionError(error) },
    'MongoDB connection failed'
  );
  process.exitCode = 1;
}
