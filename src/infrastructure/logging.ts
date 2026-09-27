import { randomUUID } from 'node:crypto';
import pino from 'pino';
import { pinoHttp } from 'pino-http';
import type { Request, RequestHandler, Response } from 'express';
import type { Logger } from 'pino';

export const logger = pino({ level: 'info' });

export function createHttpLogger(parentLogger: Logger): RequestHandler {
  return pinoHttp<Request, Response>({
    logger: parentLogger,
    quietReqLogger: true,
    quietResLogger: true,
    genReqId: (_req, res) => {
      const requestId = randomUUID();
      res.setHeader('X-Request-Id', requestId);
      return requestId;
    },
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessObject: (req, res, loggable) => ({
      method: req.method,
      path: req.originalUrl?.split('?')[0],
      statusCode: res.statusCode,
      responseTime: loggable.responseTime,
    }),
    customErrorObject: (req, res, _error, loggable) => ({
      method: req.method,
      path: req.originalUrl?.split('?')[0],
      statusCode: res.statusCode,
      responseTime: loggable.responseTime,
    }),
  });
}
