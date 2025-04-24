import express from 'express';
import { Types } from 'mongoose';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import FavoriteRepo from '../database/repository/FavoriteRepo';
import JobRepo from '../database/repository/JobRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import { ProtectedRequest } from '../types/app-request';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Favorites
 *     description: Job favorites management
 */

router.use(authentication);

/**
 * @swagger
 * /favorite/add:
 *   post:
 *     summary: Add a job to favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: ID of the job to favorite
 *     responses:
 *       200:
 *         description: Job added to favorites successfully
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
 *                     success:
 *                       type: boolean
 *       400:
 *         description: Bad request - Invalid job ID or job already favorited
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Job not found
 */
router.post(
  '/add',
  validator(schema.favorite.add),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { jobId } = req.body;
    const userId = req.user._id;

    // Check if job exists
    const jobObjectId = new Types.ObjectId(jobId);
    const job = await JobRepo.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');

    // Check if already favorited
    const isFavorited = await FavoriteRepo.isJobFavorited(userId, jobObjectId);
    if (isFavorited) throw new BadRequestError('Job already in favorites');

    // Add to favorites
    await FavoriteRepo.create(userId, jobObjectId);

    new SuccessResponse('Job added to favorites successfully', {
      success: true,
    }).send(res);
  }),
);

/**
 * @swagger
 * /favorite/list:
 *   get:
 *     summary: Get all favorited jobs
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorited jobs fetched successfully
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
 *                     favorites:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/list',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const favorites = await FavoriteRepo.findByUser(req.user._id);

    new SuccessResponse('Favorited jobs fetched successfully', {
      favorites,
    }).send(res);
  }),
);

/**
 * @swagger
 * /favorite/check/{jobId}:
 *   get:
 *     summary: Check if a job is favorited
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job to check
 *     responses:
 *       200:
 *         description: Favorite status checked successfully
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
 *                     isFavorited:
 *                       type: boolean
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Job not found
 */
router.get(
  '/check/:jobId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { jobId } = req.params;

    // Check if job exists
    const jobObjectId = new Types.ObjectId(jobId);
    const job = await JobRepo.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');

    const isFavorited = await FavoriteRepo.isJobFavorited(
      req.user._id,
      jobObjectId,
    );

    new SuccessResponse('Favorite status checked successfully', {
      isFavorited,
    }).send(res);
  }),
);

/**
 * @swagger
 * /favorite/remove:
 *   post:
 *     summary: Remove a job from favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: ID of the job to remove from favorites
 *     responses:
 *       200:
 *         description: Job removed from favorites successfully
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
 *                     success:
 *                       type: boolean
 *       400:
 *         description: Bad request - Invalid job ID
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Job not found or not favorited
 */
router.post(
  '/remove',
  validator(schema.favorite.remove),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { jobId } = req.body;
    const userId = req.user._id;

    // Check if job exists
    const jobObjectId = new Types.ObjectId(jobId);
    const job = await JobRepo.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');

    // Remove from favorites
    const isRemoved = await FavoriteRepo.remove(userId, jobObjectId);

    if (!isRemoved) {
      throw new NotFoundError('Job not found in favorites');
    }

    new SuccessResponse('Job removed from favorites successfully', {
      success: true,
    }).send(res);
  }),
);

export default router;
