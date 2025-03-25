import { PublicRequest } from 'app-request';
import express from 'express';
import authentication from '../auth/authentication';
import { BadRequestError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import NotificationRepo from '../database/repository/NotificationRepo';
import asyncHandler from '../helpers/asyncHandler';

const router = express.Router();

router.use(authentication);

router.get(
  '/:userId',
  asyncHandler(async (req: PublicRequest, res) => {
    const notifications = await NotificationRepo.findByUserId(
      req.params.userId,
    );
    new SuccessResponse('Notifications Retrieved Successfully', {
      notifications,
    }).send(res);
  }),
);

router.post(
  '/',
  asyncHandler(async (req: PublicRequest, res) => {
    const { userId, chatId, messageId } = req.body;

    if (!userId || !chatId || !messageId) {
      throw new BadRequestError('UserId, ChatId, MessageId, are required');
    }

    const notification = await NotificationRepo.create({
      userId,
      chatId,
      messageId,
    });

    new SuccessResponse('Notification created successfully', {
      notification,
    }).send(res);
  }),
);

router.put(
  '/:notificationId/status',
  asyncHandler(async (req: PublicRequest, res) => {
    const { status } = req.body;
    const { notificationId } = req.params;
    if (!status) {
      throw new BadRequestError('Status is required');
    }

    const updatedNotification = await NotificationRepo.updateStatus(
      notificationId,
      status,
    );
    new SuccessResponse('Notification status updates successfully', {
      updatedNotification,
    }).send(res);
  }),
);
export default router;
