import { NextFunction, Response } from 'express';
import { ForbiddenError } from '../core/ApiError';
import { RoleCode } from '../database/model/Role';
import { ProtectedRequest } from '../types/app-request';

export default (allowedRoles: RoleCode[]) =>
  (req: ProtectedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user.role;
    try {
      const exists = allowedRoles.find((role) => userRole.code === role);
      if (!exists)
        throw new ForbiddenError(
          'Permission denied: You are not allowed to access this route',
        );

      next();
    } catch (error) {
      next(error);
    }
  };
