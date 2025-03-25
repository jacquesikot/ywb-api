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

router.use(authentication);

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
      filter.hoursPerWeek = Number(hoursPerWeek);
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
