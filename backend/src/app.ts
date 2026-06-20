import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { apiLimiter } from './middlewares/rate-limit.middleware';
import { errorHandler } from './middlewares/error.middleware';

dotenv.config();

const app = express();

// Standard Security & Cross-Origin rules
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || '*',
    credentials: true,
  })
);

// Standard JSON body parses
app.use(express.json());

// Global Rate Limiter
app.use('/api', apiLimiter);

// Bind main routing entries
app.use('/api/v1', apiRouter);

// Centralized error interceptor
app.use(errorHandler);

export default app;
