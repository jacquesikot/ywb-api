import express from 'express';
import { Types } from 'mongoose';
import authentication from '../auth/authentication';
import { BadRequestError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import {
  BudgetType,
  JobStatus,
  JobType,
  LocationPreference,
} from '../database/model/Job';
import { RoleCode } from '../database/model/Role';
import JobRepo from '../database/repository/JobRepo';
import UserRepo from '../database/repository/UserRepo';
import asyncHandler from '../helpers/asyncHandler';
import roleAccess from '../helpers/roleAccess';
import validator from '../helpers/validator';
import { ProtectedRequest } from '../types/app-request';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Jobs
 *     description: Job listing and management
 */

router.use(authentication);

/**
 * @swagger
 * /job/all:
 *   get:
 *     summary: Get all jobs with optional filters
 *     tags: [Jobs]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter jobs by status
 *       - in: query
 *         name: locationPreference
 *         schema:
 *           type: string
 *           enum: [REMOTE, ONSITE, HYBRID]
 *         description: Filter jobs by location preference
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [FULL_TIME, PART_TIME, CONTRACT, ONE_TIME]
 *         description: Filter jobs by job type
 *       - in: query
 *         name: budgetType
 *         schema:
 *           type: string
 *           enum: [FIXED, HOURLY]
 *         description: Filter jobs by budget type
 *       - in: query
 *         name: minBudget
 *         schema:
 *           type: number
 *         description: Minimum budget value
 *       - in: query
 *         name: maxBudget
 *         schema:
 *           type: number
 *         description: Maximum budget value
 *       - in: query
 *         name: hoursPerWeek
 *         schema:
 *           type: number
 *         description: Filter by hours per week
 *       - in: query
 *         name: skills
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by required skills (skill IDs)
 *     responses:
 *       200:
 *         description: Jobs fetched successfully
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
 *                     jobs:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request - Invalid filter parameters
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/all',
  asyncHandler(async (req, res) => {
    const {
      status,
      locationPreference,
      type,
      budgetType,
      minBudget,
      maxBudget,
      hoursPerWeek,
      skills,
    } = req.query;

    // Initialize filter object for MongoDB query
    const filter: any = {};

    // Apply filters if query parameters are provided
    if (status) {
      if (Object.values(JobStatus).includes(status as JobStatus)) {
        filter.status = status;
      } else {
        throw new BadRequestError(`Invalid status: ${status}`);
      }
    }

    if (locationPreference) {
      if (
        Object.values(LocationPreference).includes(
          locationPreference as LocationPreference,
        )
      ) {
        filter.locationPreference = locationPreference;
      } else {
        throw new BadRequestError(
          `Invalid location preference: ${locationPreference}`,
        );
      }
    }

    if (type) {
      if (Object.values(JobType).includes(type as JobType)) {
        filter.type = type;
      } else {
        throw new BadRequestError(`Invalid job type: ${type}`);
      }
    }

    if (budgetType) {
      if (Object.values(BudgetType).includes(budgetType as BudgetType)) {
        filter['budget.type'] = budgetType;
      } else {
        throw new BadRequestError(`Invalid budget type: ${budgetType}`);
      }
    }

    if (minBudget || maxBudget) {
      filter['budget.value'] = {};
      if (minBudget) filter['budget.value'].$gte = Number(minBudget);
      if (maxBudget) filter['budget.value'].$lte = Number(maxBudget);
    }

    if (hoursPerWeek) {
      filter['hoursPerWeek.min'] = Number(hoursPerWeek);
    }

    // Filter by skills array if provided (assuming skills are array of skill IDs)
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      filter.skills = {
        $in: skillsArray.map((id: string) => new Types.ObjectId(id)),
      };
    }

    // Fetch jobs based on filter and populate related data
    const jobs = await JobRepo.findAll(filter);

    new SuccessResponse('Jobs fetched successfully', {
      jobs,
    }).send(res);
  }),
);

/**
 * @swagger
 * /job/match:
 *   get:
 *     summary: Get jobs that match the user's skills and preferences
 *     tags: [Jobs]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Matching jobs fetched successfully
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
 *                     jobs:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request - User not registered
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/match',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);
    const user = await UserRepo.findPrivateProfileById(userId);

    if (!user) {
      throw new BadRequestError('User not registered');
    }

    const jobs = await JobRepo.findJobMatch(user);

    new SuccessResponse('Jobs fetched successfully', {
      jobs,
    }).send(res);
  }),
);

/**
 * @swagger
 * /job/my-jobs:
 *   get:
 *     summary: Get jobs for the current user with optional status filtering
 *     tags: [Jobs]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, inProgress]
 *         description: |
 *           Filter jobs by status. One of: open, closed, inProgress. If omitted, returns all jobs.
 *     responses:
 *       200:
 *         description: User jobs fetched successfully
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
 *                     jobs:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request - User not registered
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/my-jobs',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    const { status } = req.query;
    let statusFilter: JobStatus | JobStatus[] | undefined;

    if (typeof status === 'string') {
      switch (status) {
        case 'open':
          statusFilter = JobStatus.OPEN;
          break;
        case 'closed':
          statusFilter = JobStatus.CLOSED;
          break;
        case 'inProgress':
          statusFilter = JobStatus.IN_PROGRESS;
          break;
        default:
          throw new BadRequestError(
            'Invalid status parameter. Allowed values: open, closed, inProgress',
          );
      }
    }

    const jobs = await JobRepo.findByUserId(userId, statusFilter);

    new SuccessResponse('User jobs fetched successfully', {
      jobs,
    }).send(res);
  }),
);

/**
 * @swagger
 * /job/{jobId}:
 *   get:
 *     summary: Get job details by ID
 *     tags: [Jobs]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job to fetch
 *     responses:
 *       200:
 *         description: Job fetched successfully
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
 *                     job:
 *                       type: object
 *       400:
 *         description: Bad request - Job not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/:jobId',
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const job = await JobRepo.findById(jobId);

    if (!job) {
      throw new BadRequestError('Job not found');
    }

    new SuccessResponse('Job fetched successfully', {
      job,
    }).send(res);
  }),
);

router.use(roleAccess([RoleCode.BUSINESS, RoleCode.CLIENT]));

/**
 * @swagger
 * /job/create:
 *   post:
 *     summary: Create a new job posting
 *     tags: [Jobs]
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
 *               - title
 *               - description
 *               - type
 *               - locationPreference
 *               - budget
 *               - skills
 *             properties:
 *               title:
 *                 type: string
 *                 description: Job title
 *               description:
 *                 type: string
 *                 description: Detailed job description
 *               type:
 *                 type: string
 *                 enum: [FULL_TIME, PART_TIME, CONTRACT, ONE_TIME]
 *                 description: Type of job
 *               locationPreference:
 *                 type: string
 *                 enum: [REMOTE, ONSITE, HYBRID]
 *                 description: Location preference for the job
 *               budget:
 *                 type: object
 *                 required:
 *                   - type
 *                   - value
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [FIXED, HOURLY]
 *                     description: Budget type
 *                   value:
 *                     type: number
 *                     description: Budget amount
 *               hoursPerWeek:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: string
 *                     description: Text description of hours
 *                   min:
 *                     type: number
 *                     description: Minimum hours per week
 *                   max:
 *                     type: number
 *                     description: Maximum hours per week
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of skill IDs required for the job
 *     responses:
 *       200:
 *         description: Job created successfully
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
 *                     job:
 *                       type: object
 *       400:
 *         description: Bad request - User not registered or validation errors
 *       401:
 *         description: Unauthorized - Invalid token
 *       403:
 *         description: Forbidden - User does not have required role
 */
router.post(
  '/create',
  validator(schema.createJob),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);
    const user = await UserRepo.findPrivateProfileById(userId);

    if (!user) {
      throw new BadRequestError('User not registered');
    }

    const job = await JobRepo.create({
      ...req.body,
      user: userId,
    });
    new SuccessResponse('Job created successfully', {
      job,
    }).send(res);
  }),
);

export default router;
