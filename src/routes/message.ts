import { ProtectedRequest } from 'app-request';
import express from 'express';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import ChatRepo from '../database/repository/ChatRepo';
import MessageRepo from '../database/repository/MessageRepo';
import NotificationRepo from '../database/repository/NotificationRepo';
import { NotificationType } from '../database/model/Notification';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Messages
 *     description: Message management within chats
 */

router.use(authentication);

/**
 * @swagger
 * /message/send:
 *   post:
 *     summary: Send a new message in a chat
 *     tags: [Messages]
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
 *               - chatId
 *               - content
 *             properties:
 *               chatId:
 *                 type: string
 *                 description: ID of the chat the message belongs to
 *               content:
 *                 type: string
 *                 description: Message content
 *     responses:
 *       200:
 *         description: Message sent successfully
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
 *                     message:
 *                       $ref: '#/components/schemas/Message'
 *       400:
 *         description: Bad request - Missing required fields
 *       404:
 *         description: Not found - Chat not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/send',
  validator(schema.sendMessage),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { chatId, content } = req.body;
    const userId = req.user._id;

    // Verify chat exists and user is a member
    const chat = await ChatRepo.findById(chatId);
    if (!chat) throw new NotFoundError('Chat not found');

    if (
      !chat.members.some((member) => member.toString() === userId.toString())
    ) {
      throw new BadRequestError('You are not a member of this chat');
    }

    // Create message
    const messageData = {
      chatId,
      userId,
      content,
      timestamp: new Date(),
      isRead: false,
    };

    const message = await MessageRepo.create(messageData);

    // Create notifications for other chat members
    const otherMembers = chat.members.filter(
      (memberId) => memberId.toString() !== userId.toString(),
    );

    for (const memberId of otherMembers) {
      await NotificationRepo.create({
        userId: memberId,
        type: NotificationType.NEW_MESSAGE,
        message: `New message in chat`,
        data: {
          chatId,
          messageId: message._id,
          content:
            content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          senderId: userId,
        },
      });
    }

    new SuccessResponse('Message sent successfully', { message }).send(res);
  }),
);

/**
 * @swagger
 * /message/chat/{chatId}:
 *   get:
 *     summary: Get all messages in a chat
 *     tags: [Messages]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat to get messages from
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *       404:
 *         description: Chat not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/chat/:chatId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const chatId = req.params.chatId;
    const userId = req.user._id;

    // Verify chat exists and user is a member
    const chat = await ChatRepo.findById(chatId);
    if (!chat) throw new NotFoundError('Chat not found');

    if (
      !chat.members.some((member) => member.toString() === userId.toString())
    ) {
      throw new BadRequestError('You are not a member of this chat');
    }

    const messages = await MessageRepo.findByChatId(chatId);

    new SuccessResponse('Messages retrieved successfully', messages).send(res);
  }),
);

/**
 * @swagger
 * /message/read:
 *   put:
 *     summary: Mark messages as read in a chat
 *     tags: [Messages]
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
 *               - chatId
 *             properties:
 *               chatId:
 *                 type: string
 *                 description: ID of the chat to mark messages as read
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: string
 *                 message:
 *                   type: string
 *       404:
 *         description: Chat not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.put(
  '/read',
  validator(schema.readMessages),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { chatId } = req.body;
    const userId = req.user._id;

    // Verify chat exists and user is a member
    const chat = await ChatRepo.findById(chatId);
    if (!chat) throw new NotFoundError('Chat not found');

    if (
      !chat.members.some((member) => member.toString() === userId.toString())
    ) {
      throw new BadRequestError('You are not a member of this chat');
    }

    // Mark all messages in this chat as read for this user
    await MessageRepo.markAllAsRead(chatId, userId.toString());

    // Also mark related notifications as read
    await NotificationRepo.markAllAsRead(userId.toString(), chatId);

    new SuccessResponse('Messages marked as read successfully', {}).send(res);
  }),
);

export default router;
