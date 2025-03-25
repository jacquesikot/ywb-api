import { PublicRequest } from 'app-request';
import express from 'express';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import { WaveStatus } from '../database/model/Wave';
import JobRepo from '../database/repository/JobRepo';
import WaveRepo from '../database/repository/WaveRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import schema from './schema';

const router = express.Router();

router.use(authentication);

router.post(
  '/create',
  validator(schema.createWave),
  asyncHandler(async (req: PublicRequest, res) => {
    const { jobId, freelancerId } = req.body;

    const job = await JobRepo.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');

    const existingWave = await WaveRepo.findJobById(jobId);
    if (
      existingWave.some((wave) => wave.freelancerId.toString === freelancerId)
    ) {
      throw new BadRequestError('Wave already exist Job and freelancer');
    }

    const waveData = {
      jobId,
      freelancerId,
      status: WaveStatus.WAVED,
    };

    const wave = await WaveRepo.create(waveData);

    new SuccessResponse('Wave created successfully', { wave }).send(res);
  }),
);

export default router;
