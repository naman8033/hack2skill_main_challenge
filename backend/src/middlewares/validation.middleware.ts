import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new BadRequestError(`Validation failed: ${issues}`));
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        next(new BadRequestError(`Validation failed: ${issues}`));
      } else {
        next(error);
      }
    }
  };
};
