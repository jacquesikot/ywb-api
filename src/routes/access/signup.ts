import { RoleRequest } from 'app-request';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import express from 'express';
import {
  createTokens,
  generateEmailVerificationToken,
} from '../../auth/authUtils';
import { BadRequestError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';
import { RoleCode } from '../../database/model/Role';
import User from '../../database/model/User';
import UserRepo from '../../database/repository/UserRepo';
import asyncHandler from '../../helpers/asyncHandler';
import validator from '../../helpers/validator';
import schema from './schema';
import { getUserData } from './utils';
import { sendSignupVerificationEmail } from '../../mails/signup';

const router = express.Router();

/**
 * @swagger
 * /signup/basic:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *               profilePicUrl:
 *                 type: string
 *                 description: URL to user's profile picture
 *               role:
 *                 type: string
 *                 enum: [ADMIN, EMPLOYER, FREELANCER]
 *                 description: User's role in the system
 *               walletBalance:
 *                 type: number
 *                 description: User's wallet balance
 *     responses:
 *       200:
 *         description: Signup successful
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
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         verified:
 *                           type: boolean
 *                         type:
 *                           type: string
 *                         profilePicUrl:
 *                           type: string
 *                         walletBalance:
 *                           type: number
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                     emailVerificationToken:
 *                       type: string
 *       400:
 *         description: Bad request - User already registered
 */
router.post(
  '/basic',
  validator(schema.signup),
  asyncHandler(async (req: RoleRequest, res) => {
    const user = await UserRepo.findByEmail(req.body.email);
    if (user) throw new BadRequestError('User already registered');

    const accessTokenKey = crypto.randomBytes(64).toString('hex');
    const refreshTokenKey = crypto.randomBytes(64).toString('hex');
    const passwordHash = await bcrypt.hash(req.body.password, 10);

    const { user: createdUser, keystore } = await UserRepo.create(
      {
        name: req.body.name,
        email: req.body.email,
        profilePicUrl: req.body.profilePicUrl,
        password: passwordHash,
        walletBalance: 0,
      } as User,
      accessTokenKey,
      refreshTokenKey,
      req.body.role as RoleCode,
    );

    // Generate email verification token
    const emailVerificationToken = await generateEmailVerificationToken(
      createdUser._id,
    );

    // Send email verification token to the user's email address
    await sendSignupVerificationEmail(
      createdUser.email,
      emailVerificationToken,
    );

    const tokens = await createTokens(
      createdUser,
      keystore.primaryKey,
      keystore.secondaryKey,
    );
    const userData = await getUserData(createdUser);

    new SuccessResponse('Signup Successful', {
      user: userData,
      tokens: tokens,
      emailVerificationToken: emailVerificationToken,
    }).send(res);
  }),
);

export default router;
