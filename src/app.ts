import express from 'express';
import type { Express, Request, Response } from 'express';

export const app: Express = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});
