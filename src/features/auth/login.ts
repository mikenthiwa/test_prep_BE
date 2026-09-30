import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { Router as ExpressRouter } from 'express';
import { apiResponse } from '../../api-response.js';
import LoginHandler from './command/login-handler.js';

export function createLoginRouter(): ExpressRouter {
  const router = Router();
  router.post(
    '/auth/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 5,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json(
          apiResponse({
            success: false,
            status: 429,
            message: 'Sorry, something went wrong.',
          })
        );
      },
    }),
    LoginHandler
  );
  return router;
}

export const loginRouter = createLoginRouter();
