import { RoleRequest } from 'app-request';
import express from 'express';
import { verifyEmailVerificationToken } from '../../auth/authUtils';
import { BadRequestError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';
import UserRepo from '../../database/repository/UserRepo';
import asyncHandler from '../../helpers/asyncHandler';

const router = express.Router();

router.post(
  '/:token',
  asyncHandler(async (req: RoleRequest, res) => {
    const { token } = req.params;

    try {
      const { isTokenVerified, userId } =
        await verifyEmailVerificationToken(token);
      const user = await UserRepo.findById(userId);

      if (!isTokenVerified || !user) {
        throw new BadRequestError(
          'Invalid or expired email verification token',
        );
      }

      // Update the user's email verification status
      await UserRepo.updateInfo({
        ...user,
        verified: true,
      });

      new SuccessResponse('Email verified successfully', {
        user: {
          email: user.email,
          verified: true,
        },
      }).send(res);
    } catch (error) {
      throw new BadRequestError('Invalid or expired email verification token');
    }
  }),
);

export default router;
