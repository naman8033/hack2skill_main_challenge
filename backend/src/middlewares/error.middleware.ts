import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  if (statusCode >= 500) {
    logger.error(`[Unhandled Error] Path: ${req.path} | Error: ${err.stack || err}`);
  } else {
    logger.warn(`[Operational Error] Path: ${req.path} | Code: ${statusCode} | Msg: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode >= 500 && process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred.' 
        : message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};
