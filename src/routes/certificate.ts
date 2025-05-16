import express from 'express';
import { Types } from 'mongoose';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import CertificateRepo from '../database/repository/CertificateRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import { ProtectedRequest } from '../types/app-request';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Certificate
 *     description: Certificate management
 */

router.use(authentication);

/**
 * @swagger
 * /certificate/create:
 *   post:
 *     summary: Add a new certificate record
 *     tags: [Certificate]
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
 *               - name
 *               - issuedBy
 *               - yearIssued
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the certificate
 *               issuedBy:
 *                 type: string
 *                 description: Organization that issued the certificate
 *               website:
 *                 type: string
 *                 description: Website of the issuing organization
 *               yearIssued:
 *                 type: string
 *                 description: Year when the certificate was issued
 *               expiration:
 *                 type: string
 *                 description: Expiration date or year (if applicable)
 *     responses:
 *       200:
 *         description: Certificate record created successfully
 *       400:
 *         description: Bad request - Invalid certificate data
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/create',
  validator(schema.certificate.create),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const certificate = await CertificateRepo.create({
      ...req.body,
      user: req.user._id,
    });

    new SuccessResponse(
      'Certificate record created successfully',
      certificate,
    ).send(res);
  }),
);

/**
 * @swagger
 * /certificate/list:
 *   get:
 *     summary: Get all certificate records for the authenticated user
 *     tags: [Certificate]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Certificate records retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/list',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const certificates = await CertificateRepo.findByUser(req.user._id);

    new SuccessResponse(
      'Certificate records retrieved successfully',
      certificates,
    ).send(res);
  }),
);

/**
 * @swagger
 * /certificate/{id}:
 *   get:
 *     summary: Get a specific certificate record by ID
 *     tags: [Certificate]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The certificate record ID
 *     responses:
 *       200:
 *         description: Certificate record retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Certificate record not found
 */
router.get(
  '/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    const certificate = await CertificateRepo.findById(new Types.ObjectId(id));
    if (!certificate) throw new NotFoundError('Certificate record not found');

    new SuccessResponse(
      'Certificate record retrieved successfully',
      certificate,
    ).send(res);
  }),
);

/**
 * @swagger
 * /certificate/update/{id}:
 *   put:
 *     summary: Update a certificate record by ID
 *     tags: [Certificate]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The certificate record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               issuedBy:
 *                 type: string
 *               website:
 *                 type: string
 *               yearIssued:
 *                 type: string
 *               expiration:
 *                 type: string
 *     responses:
 *       200:
 *         description: Certificate record updated successfully
 *       400:
 *         description: Bad request - Invalid certificate data
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Certificate record not found
 */
router.put(
  '/update/:id',
  validator(schema.certificate.update),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    const certificate = await CertificateRepo.findById(new Types.ObjectId(id));
    if (!certificate) throw new NotFoundError('Certificate record not found');

    if (certificate.user.toString() !== req.user._id.toString())
      throw new BadRequestError(
        'You can only update your own certificate records',
      );

    const updatedCertificate = await CertificateRepo.updateById(
      new Types.ObjectId(id),
      req.body,
    );

    new SuccessResponse(
      'Certificate record updated successfully',
      updatedCertificate,
    ).send(res);
  }),
);

/**
 * @swagger
 * /certificate/delete/{id}:
 *   delete:
 *     summary: Delete a certificate record by ID
 *     tags: [Certificate]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The certificate record ID
 *     responses:
 *       200:
 *         description: Certificate record deleted successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Certificate record not found
 */
router.delete(
  '/delete/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    const certificate = await CertificateRepo.findById(new Types.ObjectId(id));
    if (!certificate) throw new NotFoundError('Certificate record not found');

    if (certificate.user.toString() !== req.user._id.toString())
      throw new BadRequestError(
        'You can only delete your own certificate records',
      );

    await CertificateRepo.deleteById(new Types.ObjectId(id));

    new SuccessResponse('Certificate record deleted successfully', {}).send(
      res,
    );
  }),
);

export default router;
