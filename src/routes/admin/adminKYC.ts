import { ProtectedRequest } from 'app-request';
import express from 'express';
import { Types } from 'mongoose';
import authentication from '../../auth/authentication';
import { BadRequestError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';
import KYCRepo from '../../database/repository/KYCRepo';
import asyncHandler from '../../helpers/asyncHandler';
import validator, { ValidationSource } from '../../helpers/validator';
import Joi from 'joi';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Administrative functions for system management
 */

router.use(authentication);

/**
 * @swagger
 * /admin/kyc:
 *   get:
 *     summary: Get all KYC records
 *     tags: [Admin, KYC]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: approved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of records
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: List of KYC records
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const filters: { approved?: boolean } = {};
    const pagination: { limit?: number; offset?: number } = {};

    // Parse query parameters
    if (req.query.approved !== undefined) {
      filters.approved = req.query.approved === 'true';
    }

    if (req.query.limit) {
      pagination.limit = parseInt(req.query.limit as string);
    }

    if (req.query.offset) {
      pagination.offset = parseInt(req.query.offset as string);
    }

    const kycs = await KYCRepo.findAll(filters, pagination);

    return new SuccessResponse('KYC records', kycs).send(res);
  }),
);

/**
 * @swagger
 * /admin/kyc/{id}/approve:
 *   put:
 *     summary: Approve a KYC record
 *     tags: [Admin, KYC]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: KYC record ID
 *     responses:
 *       200:
 *         description: KYC record approved successfully
 *       404:
 *         description: KYC record not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.put(
  '/:id/approve',
  validator(
    Joi.object({
      id: Joi.string().required(),
    }),
    ValidationSource.PARAM,
  ),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const kycId = new Types.ObjectId(req.params.id);

    const kyc = await KYCRepo.findById(kycId);
    if (!kyc) throw new BadRequestError('KYC record not found');

    kyc.approved = true;
    kyc.updatedAt = new Date();

    const updatedKYC = await KYCRepo.update(kyc);

    return new SuccessResponse(
      'KYC record approved successfully',
      updatedKYC,
    ).send(res);
  }),
);

/**
 * @swagger
 * /admin/kyc/{id}/reject:
 *   put:
 *     summary: Reject a KYC record
 *     tags: [Admin, KYC]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: KYC record ID
 *     responses:
 *       200:
 *         description: KYC record rejected successfully
 *       404:
 *         description: KYC record not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.put(
  '/:id/reject',
  validator(
    Joi.object({
      id: Joi.string().required(),
    }),
    ValidationSource.PARAM,
  ),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const kycId = new Types.ObjectId(req.params.id);

    const kyc = await KYCRepo.findById(kycId);
    if (!kyc) throw new BadRequestError('KYC record not found');

    kyc.approved = false;
    kyc.updatedAt = new Date();

    const updatedKYC = await KYCRepo.update(kyc);

    return new SuccessResponse(
      'KYC record rejected successfully',
      updatedKYC,
    ).send(res);
  }),
);

export default router;
