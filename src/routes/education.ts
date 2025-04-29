import express from 'express';
import { Types } from 'mongoose';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import EducationRepo from '../database/repository/EducationRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import { ProtectedRequest } from '../types/app-request';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Education
 *     description: Education history management
 */

router.use(authentication);

/**
 * @swagger
 * /education/create:
 *   post:
 *     summary: Add a new education record
 *     tags: [Education]
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
 *               - degree
 *               - fieldOfStudy
 *               - institutionName
 *               - startYear
 *             properties:
 *               degree:
 *                 type: string
 *                 description: Degree or certification earned
 *               fieldOfStudy:
 *                 type: string
 *                 description: Field of study or major
 *               institutionName:
 *                 type: string
 *                 description: Name of the educational institution
 *               location:
 *                 type: string
 *                 description: Location of the institution
 *               institutionWebsite:
 *                 type: string
 *                 description: Website of the institution
 *               startYear:
 *                 type: number
 *                 description: Year education started
 *               endYear:
 *                 type: number
 *                 description: Year education ended (if applicable)
 *               description:
 *                 type: string
 *                 description: Additional details about the education
 *     responses:
 *       200:
 *         description: Education record created successfully
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
 *       400:
 *         description: Bad request - Invalid education data
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/create',
  validator(schema.education.create),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const education = await EducationRepo.create({
      ...req.body,
      user: req.user._id,
    });

    new SuccessResponse(
      'Education record created successfully',
      education,
    ).send(res);
  }),
);

/**
 * @swagger
 * /education/list:
 *   get:
 *     summary: Get all education records for the authenticated user
 *     tags: [Education]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Education records retrieved successfully
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
 *                     educations:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/list',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const educations = await EducationRepo.findByUser(req.user._id);

    new SuccessResponse(
      'Education records retrieved successfully',
      educations,
    ).send(res);
  }),
);

/**
 * @swagger
 * /education/{id}:
 *   get:
 *     summary: Get a specific education record by ID
 *     tags: [Education]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The education record ID
 *     responses:
 *       200:
 *         description: Education record retrieved successfully
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
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Education record not found
 */
router.get(
  '/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    const education = await EducationRepo.findById(new Types.ObjectId(id));
    if (!education) throw new NotFoundError('Education record not found');

    new SuccessResponse(
      'Education record retrieved successfully',
      education,
    ).send(res);
  }),
);

/**
 * @swagger
 * /education/update/{id}:
 *   put:
 *     summary: Update an education record by ID
 *     tags: [Education]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The education record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               degree:
 *                 type: string
 *               fieldOfStudy:
 *                 type: string
 *               institutionName:
 *                 type: string
 *               location:
 *                 type: string
 *               institutionWebsite:
 *                 type: string
 *               startYear:
 *                 type: number
 *               endYear:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Education record updated successfully
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
 *       400:
 *         description: Bad request - Invalid education data
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Education record not found
 */
router.put(
  '/update/:id',
  validator(schema.education.update),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    // Check if education record exists
    const exists = await EducationRepo.findById(new Types.ObjectId(id));
    if (!exists) throw new NotFoundError('Education record not found');

    const updated = await EducationRepo.updateById(
      new Types.ObjectId(id),
      req.body,
    );

    new SuccessResponse('Education record updated successfully', updated).send(
      res,
    );
  }),
);

/**
 * @swagger
 * /education/delete/{id}:
 *   delete:
 *     summary: Delete an education record by ID
 *     tags: [Education]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The education record ID
 *     responses:
 *       200:
 *         description: Education record deleted successfully
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
 *                     success:
 *                       type: boolean
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Education record not found
 */
router.delete(
  '/delete/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    // Check if education record exists
    const exists = await EducationRepo.findById(new Types.ObjectId(id));
    if (!exists) throw new NotFoundError('Education record not found');

    await EducationRepo.deleteById(new Types.ObjectId(id));

    new SuccessResponse('Education record deleted successfully', {
      success: true,
    }).send(res);
  }),
);

export default router;
