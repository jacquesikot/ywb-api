import express from 'express';
import bcrypt from 'bcrypt';
import {
  clearResetPasswordToken,
  verifyResetPasswordToken,
} from '../../auth/authUtils';
import { BadRequestError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';
import UserRepo from '../../database/repository/UserRepo';
import { UserModel } from '../../database/model/User';
import asyncHandler from '../../helpers/asyncHandler';
import validator from '../../helpers/validator';
import { PublicRequest } from '../../types/app-request';
import schema from './schema';
import { Types } from 'mongoose';
import { sendPasswordChangedEmail } from '../../mails/password-success';

const router = express.Router();

// Helper function to update user password
async function updateUserPassword(userId: Types.ObjectId, password: string) {
  return UserModel.updateOne(
    { _id: userId },
    {
      $set: {
        password: password,
        updatedAt: new Date(),
      },
    },
  ).exec();
}

/**
 * @swagger
 * /reset-password:
 *   get:
 *     summary: Render reset password page
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Reset password token
 *     responses:
 *       200:
 *         description: HTML page for resetting password
 *       400:
 *         description: Bad request - Invalid or expired token
 */
router.get(
  '/',
  asyncHandler(async (req: PublicRequest, res) => {
    const { token } = req.query;

    if (!token) {
      return res.render('reset-password', {
        token: '',
        error: 'Reset token is required',
        success: '',
      });
    }

    try {
      // Verify token but don't clear it yet
      await verifyResetPasswordToken(token as string);

      return res.render('reset-password', {
        token: token,
        error: '',
        success: '',
      });
    } catch (error) {
      return res.render('reset-password', {
        token: '',
        error: 'Invalid or expired reset token',
        success: '',
      });
    }
  }),
);

/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset password token
 *               password:
 *                 type: string
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Bad request - Invalid token or user not found
 */
router.post(
  '/',
  validator(schema.resetPassword),
  asyncHandler(async (req: PublicRequest, res) => {
    // Handle both form submissions and API requests
    const token = req.body.token;
    const password = req.body.password;

    try {
      const { userId } = await verifyResetPasswordToken(token);

      // Convert userId to ObjectId if it isn't already
      const userIdString = userId.toString();
      const userObjectId = new Types.ObjectId(userIdString);

      const user = await UserRepo.findById(userObjectId);
      if (!user) {
        if (req.headers['content-type']?.includes('application/json')) {
          throw new BadRequestError('User not found');
        } else {
          return res.render('reset-password', {
            token,
            error: 'User not found',
            success: '',
          });
        }
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(password, 10);
      await updateUserPassword(user._id, passwordHash);

      // Clear the reset token
      await clearResetPasswordToken(token);

      // Return response based on request type
      if (req.headers['content-type']?.includes('application/json')) {
        await sendPasswordChangedEmail(user.email);
        return new SuccessResponse('Password reset successful', {}).send(res);
      } else {
        return res.render('reset-password', {
          token: '',
          error: '',
          success:
            'Password has been reset successfully. You can now login with your new password.',
        });
      }
    } catch (error) {
      if (req.headers['content-type']?.includes('application/json')) {
        throw new BadRequestError('Invalid or expired reset token');
      } else {
        return res.render('reset-password', {
          token,
          error: 'Invalid or expired reset token',
          success: '',
        });
      }
    }
  }),
);

export default router;
