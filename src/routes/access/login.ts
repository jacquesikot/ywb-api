import bcrypt from 'bcrypt';
import crypto from 'crypto';
import express from 'express';
import { createTokens } from '../../auth/authUtils';
import { google } from '../../config';
import { AuthFailureError, BadRequestError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';
import KeystoreRepo from '../../database/repository/KeystoreRepo';
import UserRepo from '../../database/repository/UserRepo';
import asyncHandler from '../../helpers/asyncHandler';
import validator from '../../helpers/validator';
import { PublicRequest } from '../../types/app-request';
import schema from './schema';
import { getUserData } from './utils';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Authentication and user access
 */

/**
 * @swagger
 * /login/basic:
 *   post:
 *     summary: Login with email and password
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
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       400:
 *         description: Bad request - User not registered or credential not set
 *       401:
 *         description: Authentication failure - Invalid credentials
 */
router.post(
  '/basic',
  validator(schema.credential),
  asyncHandler(async (req: PublicRequest, res) => {
    const user = await UserRepo.findByEmail(req.body.email);
    if (!user) throw new BadRequestError('User not registered');
    if (!user.password) throw new BadRequestError('Credential not set');

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) throw new AuthFailureError('Authentication failure');

    const accessTokenKey = crypto.randomBytes(64).toString('hex');
    const refreshTokenKey = crypto.randomBytes(64).toString('hex');

    await KeystoreRepo.create(user, accessTokenKey, refreshTokenKey);
    const tokens = await createTokens(user, accessTokenKey, refreshTokenKey);
    const userData = await getUserData(user);

    new SuccessResponse('Login Success', {
      user: userData,
      tokens: tokens,
    }).send(res);
  }),
);

/**
 * @swagger
 * /login/google:
 *   post:
 *     summary: Login or register with Google
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
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google OAuth ID token
 *               roleCode:
 *                 type: string
 *                 description: Role code
 *                 enum: [FREELANCER, CLIENT, BUSINESS]
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       400:
 *         description: Bad request - Invalid Google token or user data
 *       401:
 *         description: Authentication failure - Invalid credentials
 */
router.post(
  '/google',
  validator(schema.google),
  asyncHandler(async (req: PublicRequest, res) => {
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(google.clientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: req.body.idToken,
        audience: google.clientId,
      });
    } catch (e) {
      throw new BadRequestError('Invalid Google ID token');
    }
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new BadRequestError('Google token missing email');
    }
    let user = await UserRepo.findByEmail(payload.email);
    if (!user) {
      // Create new user with data from Google
      user = await UserRepo.createGoogleUser({
        name: payload.name || payload.email,
        email: payload.email,
        profilePicUrl: payload.picture,
        roleCode: req.body.roleCode,
      });
    }
    const accessTokenKey = crypto.randomBytes(64).toString('hex');
    const refreshTokenKey = crypto.randomBytes(64).toString('hex');
    await KeystoreRepo.create(user, accessTokenKey, refreshTokenKey);
    const tokens = await createTokens(user, accessTokenKey, refreshTokenKey);
    const userData = await getUserData(user);
    new SuccessResponse('Login Success', {
      user: userData,
      tokens: tokens,
    }).send(res);
  }),
);

export default router;
