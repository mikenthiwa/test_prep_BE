import express from 'express';
import type { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { errorHandler } from './infrastructure/errors.js';
import { createHttpLogger, logger } from './infrastructure/logging.js';
import {
  createProblemDetails,
  PROBLEM_JSON_CONTENT_TYPE,
} from './problem-details.js';

export const app: Express = express();

app.use(createHttpLogger(logger));
app.use(express.json());

app.get('/health/ready', (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  if (mongoose.connection.readyState === 1) {
    res.json({ status: 'ready' });
    return;
  }

  const path = req.originalUrl.split('?')[0] ?? '/health/ready';
  res
    .status(503)
    .type(PROBLEM_JSON_CONTENT_TYPE)
    .json(
      createProblemDetails(503, 'MongoDB is unavailable.', {
        instance: path,
        requestId: String(req.id),
      })
    );
});

app.use('/{*splat}', (req: Request, res: Response) => {
  const path = req.originalUrl.split('?')[0] ?? '/';
  res
    .status(404)
    .type(PROBLEM_JSON_CONTENT_TYPE)
    .json(
      createProblemDetails(
        404,
        `The requested resource ${path} was not found.`,
        {
          instance: path,
          requestId: String(req.id),
        }
      )
    );
});
app.use(errorHandler);
