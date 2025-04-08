import { RoleRequest } from 'app-request';
import express from 'express';
import { verifyEmailVerificationToken } from '../../auth/authUtils';
import { BadRequestError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';
import UserRepo from '../../database/repository/UserRepo';
import asyncHandler from '../../helpers/asyncHandler';

const router = express.Router();

/**
 * @swagger
 * /verify-email/{token}:
 *   post:
 *     summary: Verify user email with token
 *     tags: [Authentication]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token sent to the user's email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                         verified:
 *                           type: boolean
 *       400:
 *         description: Bad request - Invalid or expired email verification token
 */
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
