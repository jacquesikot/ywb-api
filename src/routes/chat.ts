import { ProtectedRequest } from 'app-request';
import express from 'express';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import { NotificationType } from '../database/model/Notification';
import ChatRepo from '../database/repository/ChatRepo';
import JobRepo from '../database/repository/JobRepo';
import MessageRepo from '../database/repository/MessageRepo';
import NotificationRepo from '../database/repository/NotificationRepo';
import UserRepo from '../database/repository/UserRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Chats
 *     description: Chat management between users for jobs
 */

router.use(authentication);

/**
 * @swagger
 * /chat/create:
 *   post:
 *     summary: Create a new chat between users
 *     tags: [Chats]
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
 *               - receiverId
 *               - message
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: ID of the user receiving the chat invitation
 *               message:
 *                 type: string
 *                 description: Initial message content
 *               jobId:
 *                 type: string
 *                 description: Optional ID of the job the chat is related to
 *               waveId:
 *                 type: string
 *                 description: Optional ID of the related wave (job application)
 *     responses:
 *       200:
 *         description: Chat created successfully
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
 *                     chat:
 *                       $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Bad request - Missing required fields
 *       404:
 *         description: Not found - User not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/create',
  validator(schema.createChat),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { receiverId, message, jobId, waveId } = req.body;
    const user = req.user;

    // Check if receiver exists
    const receiver = await UserRepo.findById(receiverId);
    if (!receiver) throw new NotFoundError('Receiver not found');

    const chatData = {
      ownerId: user._id,
      members: [user._id, receiverId],
      jobId,
      waveId,
      createdAt: new Date(),
    };

    const chat = await ChatRepo.create(chatData);

    // Create initial message
    if (message) {
      await MessageRepo.create({
        chatId: chat._id,
        userId: user._id,
        content: message,
        timestamp: new Date(),
        isRead: false,
      });

      await NotificationRepo.create({
        type: NotificationType.NEW_MESSAGE,
        message,
        data: {
          chatId: chat._id,
          messageId: message._id,
          content: message,
          senderId: user._id,
        },
      });
    }

    new SuccessResponse('Chat created successfully', { chat }).send(res);
  }),
);

/**
 * @swagger
 * /chat/list:
 *   get:
 *     summary: Get all chats for the current user
 *     tags: [Chats]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chats retrieved successfully
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
 *                     chats:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/list',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const userId = req.user._id.toString();
    const chats = await ChatRepo.findByMemberId(userId);

    new SuccessResponse('Chats retrieved successfully', chats).send(res);
  }),
);

/**
 * @swagger
 * /chat/{id}:
 *   get:
 *     summary: Get chat by ID
 *     tags: [Chats]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat retrieved successfully
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
 *                     chat:
 *                       $ref: '#/components/schemas/Chat'
 *       404:
 *         description: Chat not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const chatId = req.params.id;
    const userId = req.user._id;

    const chat = await ChatRepo.findById(chatId);
    if (!chat) throw new NotFoundError('Chat not found');

    // Check if user is a member of the chat
    if (
      !chat.members.some((member) => member.toString() === userId.toString())
    ) {
      throw new BadRequestError('You are not a member of this chat');
    }

    new SuccessResponse('Chat retrieved successfully', { chat }).send(res);
  }),
);

/**
 * @swagger
 * /chat/{id}/members:
 *   post:
 *     summary: Add members to a chat
 *     tags: [Chats]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberIds
 *             properties:
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to add to the chat
 *     responses:
 *       200:
 *         description: Members added successfully
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
 *                     chat:
 *                       $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Chat not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/:id/members',
  validator(schema.addChatMembers),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const chatId = req.params.id;
    const { memberIds } = req.body;
    const userId = req.user._id;

    const chat = await ChatRepo.findById(chatId);
    if (!chat) throw new NotFoundError('Chat not found');

    // Check if user is the owner of the chat
    if (chat.ownerId.toString() !== userId.toString()) {
      throw new BadRequestError('Only the chat owner can add members');
    }

    // Add members to the chat
    const uniqueMembers = [
      ...new Set([...chat.members.map((m) => m.toString()), ...memberIds]),
    ];

    const updatedChat = await ChatRepo.update(chatId, {
      members: uniqueMembers,
    });

    new SuccessResponse('Members added successfully', {
      chat: updatedChat,
    }).send(res);
  }),
);

export default router;
