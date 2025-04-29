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
 * /wave/update-status/{id}:
 *   put:
 *     summary: Update wave status (accept or reject)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [waved, accepted, rejected]
 *                 description: New status for the wave
 *     responses:
 *       200:
 *         description: Wave status updated successfully
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
 *         description: Bad request - Invalid status
 *       404:
 *         description: Not found - Wave not found
 *       401:
 *         description: Unauthorized - Invalid token or not authorized to update this wave
 */
router.put(
  '/update-status/:id',
  validator(schema.updateWaveStatus),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const waveId = req.params.id;
    const { status } = req.body;
    const userId = req.user._id;

    // Check if the wave exists
    const wave = await WaveRepo.findById(waveId);
    if (!wave) throw new NotFoundError('Wave not found');

    // Get job details
    const job = await JobRepo.findById(wave.jobId.toString());
    if (!job) throw new NotFoundError('Job not found');

    // Check if the user is authorized to update the wave status
    // Only job owner can update wave status
    if (job.user._id.toString() !== userId.toString()) {
      throw new BadRequestError('Not authorized to update this wave');
    }

    // Update the wave status
    const updatedWave = await WaveRepo.updateStatusById(
      waveId,
      status as WaveStatus,
    );
    if (!updatedWave) throw new NotFoundError('Failed to update wave status');

    // Get freelancer details for notifications
    const freelancer = await UserRepo.findById(wave.freelancerId);
    if (!freelancer) throw new NotFoundError('Freelancer not found');

    // If status is changed to accepted, create a new chat and notification
    if (status === WaveStatus.ACCEPTED) {
      // Create notification for freelancer about acceptance
      await NotificationRepo.create({
        type: NotificationType.NEW_WAVE,
        userId: freelancer._id,
        message: `Your wave for ${job.title} has been accepted by ${req.user.name}`,
        data: {
          waveId: wave._id,
          jobId: job._id,
          userId: freelancer._id.toString(),
        },
      });

      // Check if chat already exists
      const existingChat = await ChatRepo.findByWaveId(waveId);

      if (!existingChat) {
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
          content: `Application accepted. You can now discuss the job "${job.title}" here.`,
          userId: job.user._id,
        });

        // Notify freelancer about the new chat
        await NotificationRepo.create({
          type: NotificationType.CHAT_CREATED,
          userId: freelancer._id,
          message: `A new chat has been created for the job "${job.title}"`,
          data: {
            chatId: newChat._id,
            jobId: job._id,
            waveId: wave._id,
          },
        });
      }
    } else if (status === WaveStatus.REJECTED) {
      // Create notification for freelancer about rejection
      await NotificationRepo.create({
        type: NotificationType.NEW_WAVE,
        userId: freelancer._id,
        message: `Your wave for ${job.title} has been rejected`,
        data: {
          waveId: wave._id,
          jobId: job._id,
          userId: freelancer._id.toString(),
        },
      });
    }

    new SuccessResponse('Wave status updated successfully', {
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
      Object.entries(wavesByFreelancerId).map(async ([freelancerIdStr, userWaves]: [string, any[]]) => {
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
          })
        );
        
        // Filter out any null entries (where job wasn't found)
        const validWaves = wavesWithJobs.filter((item: any) => item !== null);

        return {
          user,
          waves: validWaves,
        };
      }),
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

export default router;
