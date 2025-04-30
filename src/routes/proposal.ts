import express from 'express';
import authentication from '../auth/authentication';
import { NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import MilestoneRepo from '../database/repository/MilestoneRepo';
import ProposalRepo from '../database/repository/ProposalRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import { ProtectedRequest } from '../types/app-request';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Proposal
 *     description: Proposal and milestone management
 */

router.use(authentication);

/**
 * @swagger
 * /proposal/create:
 *   post:
 *     summary: Create a new proposal with milestones
 *     tags: [Proposal]
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
 *               - job
 *               - pricingMode
 *               - amount
 *               - milestones
 *             properties:
 *               job:
 *                 type: string
 *                 description: Job ID
 *               pricingMode:
 *                 type: string
 *                 enum: [fixed, hourly]
 *                 description: Pricing mode for the proposal
 *               amount:
 *                 type: number
 *                 description: Proposal amount
 *               milestones:
 *                 type: array
 *                 description: List of milestones for the project
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - description
 *                     - deliverables
 *                     - dueDate
 *                     - proposalId
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Milestone name
 *                     description:
 *                       type: string
 *                       description: Milestone description
 *                     deliverables:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of deliverables
 *                     dueDate:
 *                       type: string
 *                       format: date-time
 *                       description: Due date for milestone
 *     responses:
 *       200:
 *         description: Proposal created successfully
 *       400:
 *         description: Bad request - Invalid proposal data
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/create',
  validator(schema.proposal.create),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { milestones, ...proposalData } = req.body;

    // Create the proposal
    const proposal = await ProposalRepo.create({
      ...proposalData,
      user: req.user._id,
    });

    // Create milestones for the proposal
    if (milestones && milestones.length > 0) {
      await MilestoneRepo.createMany(
        milestones.map((milestone: any) => ({
          ...milestone,
          proposalId: proposal._id,
        })),
      );
    }

    new SuccessResponse('Proposal created successfully', proposal).send(res);
  }),
);

/**
 * @swagger
 * /proposal/list:
 *   get:
 *     summary: Get all proposals for the authenticated user
 *     tags: [Proposal]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Proposals retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/list',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const proposals = await ProposalRepo.findByUser(req.user._id);
    const proposalsWithMilestones = await Promise.all(
      proposals.map(async (proposal) => {
        const milestones = await MilestoneRepo.findByProposal(proposal._id);
        return { ...proposal, milestones };
      }),
    );
    new SuccessResponse(
      'Proposals retrieved successfully',
      proposalsWithMilestones,
    ).send(res);
  }),
);

/**
 * @swagger
 * /proposal/{id}:
 *   get:
 *     summary: Get a specific proposal by ID
 *     tags: [Proposal]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The proposal ID
 *     responses:
 *       200:
 *         description: Proposal retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Proposal not found
 */
router.get(
  '/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;
    const proposal = await ProposalRepo.findById(id);
    if (!proposal) throw new NotFoundError('Proposal not found');

    new SuccessResponse('Proposal retrieved successfully', proposal).send(res);
  }),
);

/**
 * @swagger
 * /proposal/update/{id}:
 *   put:
 *     summary: Update a proposal by ID
 *     tags: [Proposal]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The proposal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pricingMode:
 *                 type: string
 *                 enum: [fixed, hourly]
 *               amount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected, completed]
 *     responses:
 *       200:
 *         description: Proposal updated successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Proposal not found
 */
router.put(
  '/update/:id',
  validator(schema.proposal.update),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;
    const proposal = await ProposalRepo.updateById(id, req.body);
    if (!proposal) throw new NotFoundError('Proposal not found');

    new SuccessResponse('Proposal updated successfully', proposal).send(res);
  }),
);

/**
 * @swagger
 * /proposal/milestone/update/{id}:
 *   put:
 *     summary: Update a milestone by ID
 *     tags: [Proposal]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The milestone ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               deliverables:
 *                 type: array
 *                 items:
 *                   type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *     responses:
 *       200:
 *         description: Milestone updated successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Milestone not found
 */
router.put(
  '/milestone/update/:id',
  validator(schema.milestone.update),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;
    const milestone = await MilestoneRepo.updateById(id, req.body);
    if (!milestone) throw new NotFoundError('Milestone not found');

    new SuccessResponse('Milestone updated successfully', milestone).send(res);
  }),
);

/**
 * @swagger
 * /proposal/milestone/status/{id}:
 *   patch:
 *     summary: Update a milestone status by ID
 *     tags: [Proposal]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The milestone ID
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
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *                 description: New status for the milestone
 *     responses:
 *       200:
 *         description: Milestone status updated successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Milestone not found
 */
router.patch(
  '/milestone/status/:id',
  validator(schema.milestone.updateStatus),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const milestone = await MilestoneRepo.updateStatusById(id, status);
    if (!milestone) throw new NotFoundError('Milestone not found');

    new SuccessResponse(
      'Milestone status updated successfully',
      milestone,
    ).send(res);
  }),
);

export default router;
