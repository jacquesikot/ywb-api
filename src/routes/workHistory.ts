import express from 'express';
import { Types } from 'mongoose';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import WorkHistoryRepo from '../database/repository/WorkHistoryRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import { ProtectedRequest } from '../types/app-request';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: WorkHistory
 *     description: Work history management
 */

router.use(authentication);

/**
 * @swagger
 * /workhistory/create:
 *   post:
 *     summary: Add a new work history record
 *     tags: [WorkHistory]
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
 *               - title
 *               - company
 *               - startYear
 *             properties:
 *               title:
 *                 type: string
 *                 description: Job title or position
 *               company:
 *                 type: string
 *                 description: Company or organization name
 *               location:
 *                 type: string
 *                 description: Location of the job
 *               website:
 *                 type: string
 *                 description: Company website
 *               startYear:
 *                 type: string
 *                 description: Year when the job started
 *               endYear:
 *                 type: string
 *                 description: Year when the job ended (if applicable)
 *               currentlyWorkHere:
 *                 type: boolean
 *                 description: Whether the user is currently working at this job
 *               description:
 *                 type: string
 *                 description: Job description and responsibilities
 *     responses:
 *       200:
 *         description: Work history record created successfully
 *       400:
 *         description: Bad request - Invalid work history data
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/create',
  validator(schema.workHistory.create),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const workHistory = await WorkHistoryRepo.create({
      ...req.body,
      user: req.user._id,
    });

    new SuccessResponse(
      'Work history record created successfully',
      workHistory,
    ).send(res);
  }),
);

/**
 * @swagger
 * /workhistory/list:
 *   get:
 *     summary: Get all work history records for the authenticated user
 *     tags: [WorkHistory]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Work history records retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/list',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const workHistories = await WorkHistoryRepo.findByUser(req.user._id);

    new SuccessResponse(
      'Work history records retrieved successfully',
      workHistories,
    ).send(res);
  }),
);

/**
 * @swagger
 * /workhistory/{id}:
 *   get:
 *     summary: Get a specific work history record by ID
 *     tags: [WorkHistory]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The work history record ID
 *     responses:
 *       200:
 *         description: Work history record retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Work history record not found
 */
router.get(
  '/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    const workHistory = await WorkHistoryRepo.findById(new Types.ObjectId(id));
    if (!workHistory) throw new NotFoundError('Work history record not found');

    new SuccessResponse(
      'Work history record retrieved successfully',
      workHistory,
    ).send(res);
  }),
);

/**
 * @swagger
 * /workhistory/update/{id}:
 *   put:
 *     summary: Update a work history record by ID
 *     tags: [WorkHistory]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The work history record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               company:
 *                 type: string
 *               location:
 *                 type: string
 *               website:
 *                 type: string
 *               startYear:
 *                 type: string
 *               endYear:
 *                 type: string
 *               currentlyWorkHere:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work history record updated successfully
 *       400:
 *         description: Bad request - Invalid work history data
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Work history record not found
 */
router.put(
  '/update/:id',
  validator(schema.workHistory.update),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    const workHistory = await WorkHistoryRepo.findById(new Types.ObjectId(id));
    if (!workHistory) throw new NotFoundError('Work history record not found');

    if (workHistory.user.toString() !== req.user._id.toString())
      throw new BadRequestError(
        'You can only update your own work history records',
      );

    // If currentlyWorkHere is true, endYear should be null/undefined
    if (req.body.currentlyWorkHere === true) {
      req.body.endYear = undefined;
    }

    const updatedWorkHistory = await WorkHistoryRepo.updateById(
      new Types.ObjectId(id),
      req.body,
    );

    new SuccessResponse(
      'Work history record updated successfully',
      updatedWorkHistory,
    ).send(res);
  }),
);

/**
 * @swagger
 * /workhistory/delete/{id}:
 *   delete:
 *     summary: Delete a work history record by ID
 *     tags: [WorkHistory]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The work history record ID
 *     responses:
 *       200:
 *         description: Work history record deleted successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Work history record not found
 */
router.delete(
  '/delete/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    const workHistory = await WorkHistoryRepo.findById(new Types.ObjectId(id));
    if (!workHistory) throw new NotFoundError('Work history record not found');

    if (workHistory.user.toString() !== req.user._id.toString())
      throw new BadRequestError(
        'You can only delete your own work history records',
      );

    await WorkHistoryRepo.deleteById(new Types.ObjectId(id));

    new SuccessResponse('Work history record deleted successfully', {}).send(
      res,
    );
  }),
);

export default router;
