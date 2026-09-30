import { app } from './app.js';
import { getJwtSecret, JwtConfigurationError } from './features/auth/config.js';
import { logger } from './infrastructure/logging.js';
import {
  classifyConnectionError,
  connectDatabase,
} from './persistence/database.js';

const port = process.env.PORT || 4000;

try {
  getJwtSecret();
  await connectDatabase();
  app.listen(port, () => {
    logger.info({ port }, `Server is running on port ${port}`);
  });
} catch (error) {
  logger.error(
    {
      reason:
        error instanceof JwtConfigurationError
          ? 'invalid_jwt_secret'
          : classifyConnectionError(error),
    },
    'Server startup failed'
  );
  process.exitCode = 1;
}
