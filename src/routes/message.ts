import { PublicRequest } from 'app-request';
import express from 'express';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import MessageRepo from '../database/repository/MessageRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import schema from './schema';

const router = express.Router();

router.use(authentication);

router.post(
  '/send',
  validator(schema.sendMessage),
  asyncHandler(async (req: PublicRequest, res) => {
    const { chatId, userId, content } = req.body;

    if (!chatId) throw new NotFoundError('Chat not found');

    if (!userId || !content) {
      throw new BadRequestError('SenderId and Content are required');
    }

    const messageData = {
      chatId,
      userId,
      content,
      createAt: new Date(),
    };

    const message = await MessageRepo.create(messageData);

    new SuccessResponse('Message Sent Successfully', { message }).send(res);
  }),
);

export default router;
