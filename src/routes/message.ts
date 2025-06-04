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
import { Types } from 'mongoose';
import { MessageType } from '../database/model/Message';

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
 *     summary: Send a message in a chat
 *     tags: [Messages]
 *     security:
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
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 */
router.post(
  '/send',
  validator(schema.sendMessage),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const {
      chatId,
      content,
      type,
      audioUrl,
      imageUrl,
      videoUrl,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      fileExtension,
    } = req.body;
    const userId = req.user._id;

    const chat = await ChatRepo.findById(chatId);
    if (!chat) throw new NotFoundError('Chat not found');

    // Create message in database
    const message = await MessageRepo.create({
      chatId: new Types.ObjectId(chatId),
      userId: userId,
      content,
      type,
      audioUrl,
      imageUrl,
      videoUrl,
      fileUrl,
      fileName,
      fileType:
        type === MessageType.TEXT
          ? 'text/plain'
          : fileExtension?.toLowerCase() === 'pdf'
            ? 'text/pdf'
            : fileType,
      timestamp: new Date(),
      isRead: false,
      fileSize,
      fileExtension,
    });

    // Emit message through Socket.IO
    const socketService = (global as any).socketService;
    if (socketService) {
      socketService.emitToChat(chatId, 'new_message', {
        _id: message._id,
        chatId: message.chatId,
        userId: message.userId,
        content: message.content,
        timestamp: message.timestamp,
        isRead: message.isRead,
      });
    }

    // Create notification for other chat members
    const otherMembers = chat.members.filter(
      (member) => member.toString() !== userId.toString(),
    );

    for (const memberId of otherMembers) {
      await NotificationRepo.create({
        userId: memberId,
        type: NotificationType.NEW_MESSAGE,
        message: `New message in chat`,
        data: {
          chatId,
          messageId: message._id,
        },
      });

      // Emit notification through Socket.IO
      if (socketService) {
        socketService.emitToUser(memberId.toString(), 'notification', {
          type: NotificationType.NEW_MESSAGE,
          message: `New message in chat`,
          data: {
            chatId,
            messageId: message._id,
          },
        });
      }
    }

    return new SuccessResponse('Message sent successfully', message).send(res);
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
