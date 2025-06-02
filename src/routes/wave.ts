import { ProtectedRequest } from 'app-request';
import express from 'express';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import { NotificationType } from '../database/model/Notification';
import { Plan } from '../database/model/User';
import { WaveStatus } from '../database/model/Wave';
import { UserWaveModel } from '../database/model/UserWave';
import ChatRepo from '../database/repository/ChatRepo';
import JobRepo from '../database/repository/JobRepo';
import MessageRepo from '../database/repository/MessageRepo';
import NotificationRepo from '../database/repository/NotificationRepo';
import UserRepo from '../database/repository/UserRepo';
import WaveRepo from '../database/repository/WaveRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import schema from './schema';
import UserWaveRepo from '../database/repository/UserWaveRepo';
import { Types } from 'mongoose';
import { capitalize } from '../utils/capitalize';

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
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: ID of the job being applied to
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

    // Check if user has available waves
    const userWave = await UserWaveRepo.getOrCreate(user._id);
    if (userWave.availableWaves <= 0) {
      throw new BadRequestError(
        'You have used all your available waves for this month',
      );
    }

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

    // Decrement user's available waves
    await UserWaveRepo.decrementWave(user._id);

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
        const freelancerDetails = await UserRepo.findById(wave.freelancerId);
        return {
          ...wave,
          job,
          freelancer: freelancerDetails,
        };
      }),
    );

    new SuccessResponse(
      'User waves retrieved successfully',
      populatedWaves,
    ).send(res);
  }),
);

/**
 * @swagger
 * /wave/job-owner:
 *   get:
 *     summary: Get all waves where the authenticated user is the job owner
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
 *         description: List of job owner's waves retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Wave'
 *       401:
 *         description: Unauthorized - Invalid token
 */
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

/**
 * @swagger
 * /wave/accept/{id}:
 *   put:
 *     summary: Accept a wave
 *     tags: [Waves]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Wave ID
 *     responses:
 *       200:
 *         description: Wave accepted successfully
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
 *         description: Bad request - Not authorized to accept this wave
 *       404:
 *         description: Not found - Wave not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.put(
  '/accept/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const waveId = req.params.id;
    const userId = req.user._id;

    // Check if the wave exists
    const wave = await WaveRepo.findById(waveId);
    if (!wave) throw new NotFoundError('Wave not found');

    // Get job details
    const job = await JobRepo.findById(wave.jobId.toString());
    if (!job) throw new NotFoundError('Job not found');

    // Check if the user is authorized to accept the wave
    if (job.user._id.toString() !== userId.toString()) {
      throw new BadRequestError('Not authorized to accept this wave');
    }

    // Update the wave status to accepted
    const updatedWave = await WaveRepo.updateStatusById(
      waveId,
      WaveStatus.ACCEPTED,
    );

    // Get freelancer details for notifications
    const freelancer = await UserRepo.findById(wave.freelancerId);
    if (!freelancer) throw new NotFoundError('Freelancer not found');

    // Create notification for freelancer about acceptance
    await NotificationRepo.create({
      type: NotificationType.NEW_WAVE,
      userId: freelancer._id,
      message: `Your wave for ${capitalize(job.title)} has been accepted by ${req.user.name}`,
      data: {
        waveId: wave._id,
        jobId: job._id,
        userId: freelancer._id.toString(),
      },
    });

    // Check if chat already exists
    const existingChat = await ChatRepo.findByWaveId(waveId);

    if (!existingChat) {
      try {
        // Create a new chat for communication
        const newChat = await ChatRepo.create({
          jobId: job._id,
          waveId: wave._id,
          ownerId: job.user._id,
          members: [job.user._id, freelancer._id],
        });

        // Add initial message to the chat
        await MessageRepo.create({
          chatId: newChat._id,
          content: `Application accepted. You can now discuss the job "${capitalize(job.title)}" here.`,
          userId: job.user._id,
        });

        // Notify freelancer about the new chat
        await NotificationRepo.create({
          type: NotificationType.CHAT_CREATED,
          userId: freelancer._id,
          message: `A new chat has been created for the job "${capitalize(job.title)}"`,
          data: {
            chatId: newChat._id,
            jobId: job._id,
            waveId: wave._id,
          },
        });
      } catch (error: any) {
        // If chat creation fails due to duplicate key, we can ignore it
        // as it means a chat already exists for these users
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    new SuccessResponse('Wave accepted successfully', {
      wave: updatedWave,
    }).send(res);
  }),
);

/**
 * @swagger
 * /wave/reject/{id}:
 *   put:
 *     summary: Reject a wave
 *     tags: [Waves]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Wave ID
 *     responses:
 *       200:
 *         description: Wave rejected successfully
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
 *         description: Bad request - Not authorized to reject this wave
 *       404:
 *         description: Not found - Wave not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.put(
  '/reject/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const waveId = req.params.id;
    const userId = req.user._id;

    // Check if the wave exists
    const wave = await WaveRepo.findById(waveId);
    if (!wave) throw new NotFoundError('Wave not found');

    // Get job details
    const job = await JobRepo.findById(wave.jobId.toString());
    if (!job) throw new NotFoundError('Job not found');

    // Check if the user is authorized to reject the wave
    if (job.user._id.toString() !== userId.toString()) {
      throw new BadRequestError('Not authorized to reject this wave');
    }

    // Update the wave status to rejected
    const updatedWave = await WaveRepo.updateStatusById(
      waveId,
      WaveStatus.REJECTED,
    );
    if (!updatedWave) throw new NotFoundError('Failed to reject wave');

    // Get freelancer details for notifications
    const freelancer = await UserRepo.findById(wave.freelancerId);
    if (!freelancer) throw new NotFoundError('Freelancer not found');

    // Create notification for freelancer about rejection
    await NotificationRepo.create({
      type: NotificationType.NEW_WAVE,
      userId: freelancer._id,
      message: `Your wave for ${capitalize(job.title)} has been rejected`,
      data: {
        waveId: wave._id,
        jobId: job._id,
        userId: freelancer._id.toString(),
      },
    });

    new SuccessResponse('Wave rejected successfully', {
      wave: updatedWave,
    }).send(res);
  }),
);

/**
 * @swagger
 * /wave/applicants:
 *   get:
 *     summary: Get unique users who have sent waves to the authenticated user
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
 *         description: Filter by wave status (optional)
 *     responses:
 *       200:
 *         description: List of unique users who have sent waves retrieved successfully
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         $ref: '#/components/schemas/User'
 *                       waves:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             wave:
 *                               $ref: '#/components/schemas/Wave'
 *                             job:
 *                               $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/applicants',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const userId = req.user._id;
    const { status } = req.query;

    // Find all waves where the authenticated user is the job owner
    let waves = await WaveRepo.findByJobOwnerId(userId.toString());

    // Filter by status if provided
    if (status && Object.values(WaveStatus).includes(status as WaveStatus)) {
      waves = waves.filter((wave) => wave.status === status);
    }

    // Group waves by freelancer ID
    interface WavesByFreelancerId {
      [key: string]: any[];
    }

    const wavesByFreelancerId: WavesByFreelancerId = {};
    waves.forEach((wave: any) => {
      const freelancerId = wave.freelancerId.toString();
      if (!wavesByFreelancerId[freelancerId]) {
        wavesByFreelancerId[freelancerId] = [];
      }
      wavesByFreelancerId[freelancerId].push(wave);
    });

    // Get unique applicant details with their associated waves and jobs
    const uniqueApplicants = await Promise.all(
      Object.entries(wavesByFreelancerId).map(
        async ([freelancerIdStr, userWaves]: [string, any[]]) => {
          // Get freelancer (applicant) details - use original ObjectId from one of the waves
          const user = await UserRepo.findById(userWaves[0].freelancerId);
          if (!user) return null;

          // Get job details for each wave
          const wavesWithJobs = await Promise.all(
            userWaves.map(async (wave: any) => {
              const job = await JobRepo.findById(wave.jobId.toString());
              if (!job) return null;

              return {
                wave,
                job,
              };
            }),
          );

          // Filter out any null entries (where job wasn't found)
          const validWaves = wavesWithJobs.filter((item: any) => item !== null);

          return {
            user,
            waves: validWaves,
          };
        },
      ),
    );

    // Filter out any null entries (where user wasn't found)
    const validApplicants = uniqueApplicants.filter(
      (applicant) => applicant !== null,
    );

    new SuccessResponse(
      'Unique wave applicants retrieved successfully',
      validApplicants,
    ).send(res);
  }),
);

/**
 * @swagger
 * /wave/available:
 *   get:
 *     summary: Get the user's available waves information
 *     tags: [Waves]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's available waves information retrieved successfully
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
 *                     userWave:
 *                       type: object
 *                       properties:
 *                         availableWaves:
 *                           type: number
 *                         lastRefillDate:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/available',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const userId = req.user._id;

    const userWave = await UserWaveRepo.getOrCreate(userId);

    const lastRefill = new Date(userWave.lastRefillDate);
    const now = new Date();
    const daysSinceLastRefill = Math.floor(
      (now.getTime() - lastRefill.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysUntilNextRefill = Math.max(0, 30 - daysSinceLastRefill);

    const nextRefillDate = new Date(lastRefill);
    nextRefillDate.setDate(nextRefillDate.getDate() + 30);

    new SuccessResponse('User waves retrieved successfully', {
      userWave: {
        availableWaves: userWave.availableWaves,
        totalWavesPerMonth: 20,
        lastRefillDate: userWave.lastRefillDate,
        nextRefillDate: nextRefillDate,
        daysUntilNextRefill: daysUntilNextRefill,
      },
    }).send(res);
  }),
);

/**
 * @swagger
 * /wave/dev/add-waves:
 *   post:
 *     summary: Add waves to a user (For testing purposes, will be removed in production)
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to add waves to
 *               wavesToAdd:
 *                 type: number
 *                 description: Number of waves to add (default 5)
 *               resetRefillDate:
 *                 type: boolean
 *                 description: Whether to reset the lastRefillDate to current date (default false)
 *     responses:
 *       200:
 *         description: Waves added successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/dev/add-waves',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { userId, wavesToAdd = 5, resetRefillDate = false } = req.body;

    if (!userId) {
      throw new BadRequestError('userId is required');
    }

    // Check if user exists
    const userExists = await UserRepo.exists(new Types.ObjectId(userId));
    if (!userExists) {
      throw new NotFoundError('User not found');
    }

    // Get or create user wave record
    let userWave = await UserWaveRepo.findByUserId(new Types.ObjectId(userId));

    if (!userWave) {
      // Create a new user wave record
      userWave = await UserWaveRepo.create(new Types.ObjectId(userId));
    }

    // Update user wave record
    const updateData: any = {
      $inc: { availableWaves: wavesToAdd },
    };

    if (resetRefillDate) {
      updateData.$set = { lastRefillDate: new Date() };
    }

    const updatedUserWave = await UserWaveModel.findByIdAndUpdate(
      userWave._id,
      updateData,
      { new: true },
    ).lean();

    new SuccessResponse('Waves added successfully', {
      userWave: updatedUserWave,
      message: `Added ${wavesToAdd} waves to user. ${resetRefillDate ? 'Last refill date was reset.' : ''}`,
    }).send(res);
  }),
);

export default router;
