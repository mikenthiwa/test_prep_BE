import express from 'express';
import type { Express, Request, RequestHandler, Response } from 'express';
import { createHttpLogger, logger } from './logging.js';

export const app: Express = express();

app.use(createHttpLogger(logger) as RequestHandler);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});
