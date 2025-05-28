import express from 'express';
import { Types } from 'mongoose';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import OfferRepo from '../database/repository/OfferRepo';
import { OfferStatus } from '../database/model/Offer';
import JobRepo from '../database/repository/JobRepo';
import UserRepo from '../database/repository/UserRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import { ProtectedRequest } from '../types/app-request';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Offer
 *     description: Job offer management
 */

router.use(authentication);

/**
 * @swagger
 * /offer/create:
 *   post:
 *     summary: Create a new job offer
 *     tags: [Offer]
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
 *               - freelancerId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: ID of the job
 *               freelancerId:
 *                 type: string
 *                 description: ID of the freelancer
 *               message:
 *                 type: string
 *                 description: Optional message to the freelancer
 *     responses:
 *       200:
 *         description: Offer created successfully
 *       400:
 *         description: Bad request - Invalid data or offer already exists
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/create',
  validator(schema.offer.create),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { jobId, freelancerId } = req.body;

    // Verify the job exists and belongs to the business
    const job = await JobRepo.findById(jobId);

    if (!job) throw new NotFoundError('Job not found');
    if (job.user._id.toString() !== req.user._id.toString())
      throw new BadRequestError(
        'You can only create invites for your own jobs',
      );

    // Verify the freelancer exists
    const freelancer = await UserRepo.findById(
      new Types.ObjectId(freelancerId.toString()),
    );
    if (!freelancer) throw new NotFoundError('Freelancer not found');

    // Check if an offer already exists
    const exists = await OfferRepo.exists(
      new Types.ObjectId(jobId),
      new Types.ObjectId(freelancerId),
    );
    if (exists)
      throw new BadRequestError(
        'An invite already exists for this job and freelancer',
      );

    const offer = await OfferRepo.create({
      job: new Types.ObjectId(jobId),
      user: req.user._id,
      freelancer: new Types.ObjectId(freelancerId),
      status: OfferStatus.PENDING,
    });

    return new SuccessResponse('Invite sent successfully', offer).send(res);
  }),
);

/**
 * @swagger
 * /offer/list:
 *   get:
 *     summary: Get all offers for the authenticated user
 *     tags: [Offer]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, DECLINED]
 *         description: Filter offers by status
 *     responses:
 *       200:
 *         description: Offers retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/list',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const status = req.query.status as OfferStatus | undefined;
    let offers;

    if (req.user.role.code === 'FREELANCER') {
      offers = await OfferRepo.findByFreelancer(req.user._id, status);
    } else if (req.user.role.code === 'BUSINESS') {
      offers = await OfferRepo.findByUser(req.user._id, status);
    } else {
      throw new BadRequestError('Invalid user role');
    }

    return new SuccessResponse('Invites retrieved successfully', offers).send(
      res,
    );
  }),
);

/**
 * @swagger
 * /offer/{id}/accept:
 *   post:
 *     summary: Accept a job offer
 *     tags: [Offer]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The offer ID
 *     responses:
 *       200:
 *         description: Offer accepted successfully
 *       400:
 *         description: Bad request - Invalid offer or unauthorized
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Offer not found
 */
router.post(
  '/:id/accept',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    const offer = await OfferRepo.findById(new Types.ObjectId(id));
    if (!offer) throw new NotFoundError('Invite not found');

    if (offer.freelancer?._id.toString() !== req.user._id.toString())
      throw new BadRequestError('You can only accept offers sent to you');

    if (offer.status !== OfferStatus.PENDING)
      throw new BadRequestError('This invite has already been processed');

    const updatedOffer = await OfferRepo.updateStatus(
      new Types.ObjectId(id),
      OfferStatus.ACCEPTED,
    );

    if (!updatedOffer) throw new NotFoundError('Failed to update invite');

    return new SuccessResponse(
      'Invite accepted successfully',
      updatedOffer,
    ).send(res);
  }),
);

/**
 * @swagger
 * /offer/{id}/decline:
 *   post:
 *     summary: Decline a job invite
 *     tags: [Offer]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The offer ID
 *     responses:
 *       200:
 *         description: Invite declined successfully
 *       400:
 *         description: Bad request - Invalid offer or unauthorized
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Offer not found
 */
router.post(
  '/:id/decline',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    const offer = await OfferRepo.findById(new Types.ObjectId(id));
    if (!offer) throw new NotFoundError('Invite not found');

    if (offer.freelancer?._id.toString() !== req.user._id.toString())
      throw new BadRequestError('You can only decline invites sent to you');

    if (offer.status !== OfferStatus.PENDING)
      throw new BadRequestError('This invite has already been processed');

    const updatedOffer = await OfferRepo.updateStatus(
      new Types.ObjectId(id),
      OfferStatus.DECLINED,
    );

    if (!updatedOffer) throw new NotFoundError('Failed to update invite');

    return new SuccessResponse(
      'Invite declined successfully',
      updatedOffer,
    ).send(res);
  }),
);

/**
 * @swagger
 * /offer/check:
 *   get:
 *     summary: Check if an invite exists for a job and freelancer
 *     tags: [Offer]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The job ID
 *       - in: query
 *         name: freelancerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The freelancer ID
 *     responses:
 *       200:
 *         description: Check completed successfully
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/check',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { jobId, freelancerId } = req.query;
    if (!jobId || !freelancerId)
      throw new BadRequestError('Job ID and freelancer ID are required');

    const exists = await OfferRepo.exists(
      new Types.ObjectId(jobId.toString()),
      new Types.ObjectId(freelancerId.toString()),
    );

    return new SuccessResponse('Check completed successfully', { exists }).send(
      res,
    );
  }),
);

/**
 * @swagger
 * /offer/withdraw:
 *   post:
 *     summary: Withdraw an invite (business only)
 *     tags: [Offer]
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
 *               - freelancerId
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: The job ID
 *               freelancerId:
 *                 type: string
 *                 description: The freelancer ID
 *     responses:
 *       200:
 *         description: Invite withdrawn successfully
 *       400:
 *         description: Bad request - Invalid offer or unauthorized
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Offer not found
 */
router.post(
  '/withdraw',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { jobId, freelancerId } = req.body;
    if (!jobId || !freelancerId)
      throw new BadRequestError('Job ID and freelancer ID are required');

    const offer = await OfferRepo.findByJobAndFreelancer(
      new Types.ObjectId(jobId),
      new Types.ObjectId(freelancerId),
    );
    if (!offer) throw new NotFoundError('Invite not found');

    if (offer.user.toString() !== req.user._id.toString())
      throw new BadRequestError('You can only withdraw invites you sent');

    if (offer.status !== OfferStatus.PENDING)
      throw new BadRequestError('This invite has already been processed');

    const updatedOffer = await OfferRepo.updateStatus(
      offer._id,
      OfferStatus.DECLINED,
    );

    return new SuccessResponse(
      'Invite withdrawn successfully',
      updatedOffer,
    ).send(res);
  }),
);

export default router;
