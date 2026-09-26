import { app } from './app.js';
import { logger } from './logging.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
  logger.info({ port }, `Server is running on port ${port}`);
});
