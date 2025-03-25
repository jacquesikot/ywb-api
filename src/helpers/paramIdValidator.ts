import { NextFunction, Request, Response } from 'express';
import { BadRequestError } from '../core/ApiError';

// Middleware to check if `id` parameter is present
const validateIdParam = (req: Request, res: Response, next: NextFunction) => {
  if (!req.params.id) {
    return next(new BadRequestError('ID param is required'));
  }
  next();
};

export default validateIdParam;
