import { PublicRequest } from 'app-request';
import express from 'express';
import authentication from '../auth/authentication';
import { BadRequestError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import NotificationRepo from '../database/repository/NotificationRepo';
import asyncHandler from '../helpers/asyncHandler';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: User notification management
 */

router.use(authentication);

/**
 * @swagger
 * /notification/{userId}:
 *   get:
 *     summary: Get notifications for a user
 *     tags: [Notifications]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to fetch notifications for
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           userId:
 *                             type: string
 *                           chatId:
 *                             type: string
 *                           messageId:
 *                             type: string
 *                           read:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized - Invalid token
 */
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

/**
 * @swagger
 * /notification:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
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
 *               - chatId
 *               - messageId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to notify
 *               chatId:
 *                 type: string
 *                 description: ID of the related chat
 *               messageId:
 *                 type: string
 *                 description: ID of the message triggering the notification
 *     responses:
 *       200:
 *         description: Notification created successfully
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
 *                     notification:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         chatId:
 *                           type: string
 *                         messageId:
 *                           type: string
 *                         read:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized - Invalid token
 */
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

/**
 * @swagger
 * /notification/{notificationId}/status:
 *   put:
 *     summary: Update notification status (read/unread)
 *     tags: [Notifications]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the notification to update
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
 *                 type: boolean
 *                 description: Read status (true = read, false = unread)
 *     responses:
 *       200:
 *         description: Notification status updated successfully
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
 *                     updatedNotification:
 *                       type: object
 *       400:
 *         description: Bad request - Status is required
 *       401:
 *         description: Unauthorized - Invalid token
 */
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
