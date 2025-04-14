import { ProtectedRequest } from 'app-request';
import express from 'express';
import { Types } from 'mongoose';
import authentication from '../auth/authentication';
import { BadRequestError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import KYCRepo from '../database/repository/KYCRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: KYC
 *     description: Know Your Customer verification and management
 */

router.use(authentication);

/**
 * @swagger
 * /kyc:
 *   post:
 *     summary: Create a new KYC record
 *     tags: [KYC]
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
 *               - taxIdentificationNumber
 *               - proofOfAddress
 *             properties:
 *               taxIdentificationNumber:
 *                 type: string
 *               businessAddress:
 *                 type: string
 *               businessLocation:
 *                 type: string
 *               certificateOfIncorporation:
 *                 type: string
 *               businessLicence:
 *                 type: string
 *               proofOfAddress:
 *                 type: string
 *               ownershipAndControlInformation:
 *                 type: string
 *               governmentIssuedId:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC record created successfully
 *       400:
 *         description: Bad request - User already has KYC record
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/',
  validator(schema.createKYC),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    // Check if user already has a KYC record
    const exists = await KYCRepo.exists(userId);
    if (exists) throw new BadRequestError('User already has a KYC record');

    const kyc = await KYCRepo.create({
      _id: new Types.ObjectId(),
      user: userId,
      taxIdentificationNumber: req.body.taxIdentificationNumber,
      businessAddress: req.body.businessAddress,
      businessLocation: req.body.businessLocation,
      certificateOfIncorporation: req.body.certificateOfIncorporation,
      businessLicence: req.body.businessLicence,
      proofOfAddress: req.body.proofOfAddress,
      ownershipAndControlInformation: req.body.ownershipAndControlInformation,
      governmentIssuedId: req.body.governmentIssuedId,
      approved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return new SuccessResponse('KYC record created successfully', kyc).send(
      res,
    );
  }),
);

/**
 * @swagger
 * /kyc:
 *   get:
 *     summary: Get user's KYC record
 *     tags: [KYC]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC record retrieved successfully
 *       404:
 *         description: KYC record not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    const kyc = await KYCRepo.findByUser(userId);
    if (!kyc) throw new BadRequestError('KYC record not found');

    return new SuccessResponse('KYC record', kyc).send(res);
  }),
);

/**
 * @swagger
 * /kyc:
 *   put:
 *     summary: Update user's KYC record
 *     tags: [KYC]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taxIdentificationNumber:
 *                 type: string
 *               businessAddress:
 *                 type: string
 *               businessLocation:
 *                 type: string
 *               certificateOfIncorporation:
 *                 type: string
 *               businessLicence:
 *                 type: string
 *               proofOfAddress:
 *                 type: string
 *               ownershipAndControlInformation:
 *                 type: string
 *               governmentIssuedId:
 *                 type: string
 *     responses:
 *       200:
 *         description: KYC record updated successfully
 *       404:
 *         description: KYC record not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.put(
  '/',
  validator(schema.updateKYC),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    const kyc = await KYCRepo.findByUser(userId);
    if (!kyc) throw new BadRequestError('KYC record not found');

    // Only update fields that are provided
    if (req.body.taxIdentificationNumber)
      kyc.taxIdentificationNumber = req.body.taxIdentificationNumber;
    if (req.body.businessAddress)
      kyc.businessAddress = req.body.businessAddress;
    if (req.body.businessLocation)
      kyc.businessLocation = req.body.businessLocation;
    if (req.body.certificateOfIncorporation)
      kyc.certificateOfIncorporation = req.body.certificateOfIncorporation;
    if (req.body.businessLicence)
      kyc.businessLicence = req.body.businessLicence;
    if (req.body.proofOfAddress) kyc.proofOfAddress = req.body.proofOfAddress;
    if (req.body.ownershipAndControlInformation)
      kyc.ownershipAndControlInformation =
        req.body.ownershipAndControlInformation;
    if (req.body.governmentIssuedId)
      kyc.governmentIssuedId = req.body.governmentIssuedId;

    const updatedKYC = await KYCRepo.update(kyc);
    return new SuccessResponse(
      'KYC record updated successfully',
      updatedKYC,
    ).send(res);
  }),
);

export default router;
