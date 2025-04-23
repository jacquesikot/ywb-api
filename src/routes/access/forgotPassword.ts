import express from 'express';
import { generateResetPasswordToken } from '../../auth/authUtils';
import { BadRequestError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';
import UserRepo from '../../database/repository/UserRepo';
import KeystoreRepo from '../../database/repository/KeystoreRepo';
import asyncHandler from '../../helpers/asyncHandler';
import validator from '../../helpers/validator';
import { PublicRequest } from '../../types/app-request';
import schema from './schema';
import crypto from 'crypto';

const router = express.Router();

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Initiate forgot password flow
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Reset password token generated successfully
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
 *                     token:
 *                       type: string
 *       400:
 *         description: Bad request - User not registered
 */
router.post(
  '/',
  validator(schema.forgotPassword),
  asyncHandler(async (req: PublicRequest, res) => {
    const user = await UserRepo.findByEmail(req.body.email);
    if (!user) throw new BadRequestError('User not registered');

    // Remove existing keystores for the user to avoid multiple reset tokens
    await KeystoreRepo.removeAllForClient(user);

    // Create a new keystore for the user
    const accessTokenKey = crypto.randomBytes(64).toString('hex');
    const refreshTokenKey = crypto.randomBytes(64).toString('hex');
    await KeystoreRepo.create(user, accessTokenKey, refreshTokenKey);

    // Generate reset password token
    const resetToken = await generateResetPasswordToken(user._id);

    // In a real-world scenario, you would send an email with a link to reset password
    // For now, we'll just return the token in the response
    new SuccessResponse('Reset password token generated', {
      token: resetToken,
    }).send(res);
  }),
);

export default router;
