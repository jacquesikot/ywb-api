import { PublicRequest } from 'app-request';
import express from 'express';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import ChatRepo from '../database/repository/ChatRepo';
import JobRepo from '../database/repository/JobRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import schema from './schema';

const router = express.Router();

router.use(authentication);

router.post(
  '/create',
  validator(schema.createChat),
  asyncHandler(async (req: PublicRequest, res) => {
    const { jobId, userId, waveId, message } = req.body;

    const job = await JobRepo.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');

    if (!message || !userId || !waveId) {
      throw new BadRequestError('Message, userId, and waveId are required');
    }

    const chatData = {
      jobId,
      userId,
      message,
      waveId,
      createdAt: new Date(),
    };

    const chat = await ChatRepo.create(chatData);

    new SuccessResponse('Chat created successfully', { chat }).send(res);
  }),
);
export default router;
