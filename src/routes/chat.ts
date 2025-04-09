import { ProtectedRequest } from 'app-request';
import express from 'express';
import authentication from '../auth/authentication';
import { SuccessResponse } from '../core/ApiResponse';
import ChatRepo from '../database/repository/ChatRepo';
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
 *     summary: Create a new chat for a job
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
 *               - jobId
 *               - userId
 *               - message
 *               - waveId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: ID of the job the chat is related to
 *               userId:
 *                 type: string
 *                 description: ID of the user creating the chat
 *               message:
 *                 type: string
 *                 description: Initial message content
 *               waveId:
 *                 type: string
 *                 description: ID of the related wave (job application)
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
 *         description: Not found - Job not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/create',
  validator(schema.createChat),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { receiverId, message } = req.body;
    const user = req.user;

    const chatData = {
      ownerId: user._id,
      members: [user._id, receiverId],
      message,
      createdAt: new Date(),
    };

    const chat = await ChatRepo.create(chatData);

    new SuccessResponse('Chat created successfully', { chat }).send(res);
  }),
);
export default router;
