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
 *               - userId
 *               - content
 *             properties:
 *               chatId:
 *                 type: string
 *                 description: ID of the chat the message belongs to
 *               userId:
 *                 type: string
 *                 description: ID of the user sending the message
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
