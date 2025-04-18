import { ProtectedRequest } from 'app-request';
import express from 'express';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import { NotificationType } from '../database/model/Notification';
import { Plan } from '../database/model/User';
import { WaveStatus } from '../database/model/Wave';
import ChatRepo from '../database/repository/ChatRepo';
import JobRepo from '../database/repository/JobRepo';
import MessageRepo from '../database/repository/MessageRepo';
import NotificationRepo from '../database/repository/NotificationRepo';
import UserRepo from '../database/repository/UserRepo';
import WaveRepo from '../database/repository/WaveRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Waves
 *     description: Job application waves between freelancers and employers
 */

router.use(authentication);

/**
 * @swagger
 * /wave/create:
 *   post:
 *     summary: Create a new wave (job application)
 *     tags: [Waves]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - freelancerId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: ID of the job being applied to
 *               freelancerId:
 *                 type: string
 *                 description: ID of the freelancer applying for the job
 *     responses:
 *       200:
 *         description: Wave created successfully
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
 *                     wave:
 *                       $ref: '#/components/schemas/Wave'
 *       400:
 *         description: Bad request - Wave already exists for this job and freelancer
 *       404:
 *         description: Not found - Job not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/create',
  validator(schema.createWave),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { jobId } = req.body;
    const user = req.user;

    const freelancerDetails = await UserRepo.findById(user._id);

    const job = await JobRepo.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');

    const existingWave = await WaveRepo.findJobById(jobId);
    if (
      existingWave.some(
        (wave) => wave.freelancerId.toString() === user._id.toString(),
      )
    ) {
      throw new BadRequestError('Wave already exist Job and freelancer');
    }

    const waveData = {
      jobId,
      job,
      freelancerId: user._id,
      status: WaveStatus.WAVED,
    };

    const wave = await WaveRepo.create(waveData);

    await NotificationRepo.create({
      type: NotificationType.NEW_WAVE,
      userId: job.user._id,
      message: 'New wave from ' + user.name + ' for ' + job.title,
      data: {
        waveId: wave._id,
        jobId: job._id,
        userId: job.user._id.toString(),
      },
    });

    if (freelancerDetails?.plan === Plan.PRO) {
      const newChat = await ChatRepo.create({
        jobId,
        waveId: wave._id,
        ownerId: user._id,
        members: [user._id, job.user._id],
      });
      await MessageRepo.create({
        chatId: newChat._id,
        content: 'New wave from ' + user.name + ' for ' + job.title,
        userId: user._id,
      });
    }

    new SuccessResponse('Wave created successfully', { wave }).send(res);
  }),
);

/**
 * @swagger
 * /wave/user:
 *   get:
 *     summary: Get all waves for the authenticated user
 *     tags: [Waves]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [waved, accepted, rejected]
 *         description: Filter waves by status (optional)
 *     responses:
 *       200:
 *         description: List of user's waves retrieved successfully
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
 *                     waves:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Wave'
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/user',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const userId = req.user._id;
    const { status } = req.query;

    let mySentWaves = await WaveRepo.findFreelancerById(userId.toString());
    let myReceivedWaves = await WaveRepo.findByJobOwnerId(userId.toString());

    // Filter by status if provided
    if (status && Object.values(WaveStatus).includes(status as WaveStatus)) {
      mySentWaves = mySentWaves.filter((wave) => wave.status === status);
      myReceivedWaves = myReceivedWaves.filter(
        (wave) => wave.status === status,
      );
    }

    // Populate job details for each wave
    const populatedWaves = await Promise.all(
      [...mySentWaves, ...myReceivedWaves].map(async (wave) => {
        const job = await JobRepo.findById(wave.jobId.toString());
        return {
          ...wave,
          job,
        };
      }),
    );
    console.log('🚀 ~ asyncHandler ~ populatedWaves:', populatedWaves);

    new SuccessResponse(
      'User waves retrieved successfully',
      populatedWaves,
    ).send(res);
  }),
);

router.get(
  '/job-owner',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const userId = req.user._id;
    const { status } = req.query;

    let waves = await WaveRepo.findByJobOwnerId(userId.toString());

    // Filter by status if provided
    if (status && Object.values(WaveStatus).includes(status as WaveStatus)) {
      waves = waves.filter((wave) => wave.status === status);
    }

    // Populate job details for each wave
    const populatedWaves = await Promise.all(
      waves.map(async (wave) => {
        const job = await JobRepo.findById(wave.jobId.toString());
        return {
          ...wave,
          job,
        };
      }),
    );

    new SuccessResponse(
      'User waves retrieved successfully',
      populatedWaves,
    ).send(res);
  }),
);

export default router;
