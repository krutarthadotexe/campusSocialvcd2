import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use(
    '/api/v1/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100
    })
  );

  app.use('/api/v1', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
