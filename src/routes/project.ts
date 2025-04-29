import express from 'express';
import { Types } from 'mongoose';
import authentication from '../auth/authentication';
import { BadRequestError, NotFoundError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import ProjectRepo from '../database/repository/ProjectRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import { ProtectedRequest } from '../types/app-request';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Project
 *     description: Project management
 */

router.use(authentication);

/**
 * @swagger
 * /project/create:
 *   post:
 *     summary: Create a new project
 *     tags: [Project]
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
 *               - description
 *               - tags
 *             properties:
 *               title:
 *                 type: string
 *                 description: Project title
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 description: Detailed project description
 *                 minLength: 10
 *               tags:
 *                 type: array
 *                 description: Keywords or categories related to the project
 *                 items:
 *                   type: string
 *               thumbnail:
 *                 type: string
 *                 description: URL to project thumbnail image
 *               images:
 *                 type: array
 *                 description: Array of image URLs related to the project
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Project created successfully
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
 *         description: Bad request - Invalid project data
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/create',
  validator(schema.project.create),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const project = await ProjectRepo.create({
      ...req.body,
      user: req.user._id,
    });

    new SuccessResponse('Project created successfully', project).send(res);
  }),
);

/**
 * @swagger
 * /project/list:
 *   get:
 *     summary: Get all projects for the authenticated user
 *     tags: [Project]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
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
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/list',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const projects = await ProjectRepo.findByUser(req.user._id);

    new SuccessResponse('Projects retrieved successfully', projects).send(res);
  }),
);

/**
 * @swagger
 * /project/{id}:
 *   get:
 *     summary: Get a specific project by ID
 *     tags: [Project]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
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
 *         description: Not found - Project not found
 */
router.get(
  '/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    const project = await ProjectRepo.findById(new Types.ObjectId(id));
    if (!project) throw new NotFoundError('Project not found');

    new SuccessResponse('Project retrieved successfully', project).send(res);
  }),
);

/**
 * @swagger
 * /project/update/{id}:
 *   put:
 *     summary: Update a project by ID
 *     tags: [Project]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               thumbnail:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
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
 *         description: Bad request - Invalid project data
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Not found - Project not found
 */
router.put(
  '/update/:id',
  validator(schema.project.update),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    // Check if project exists
    const exists = await ProjectRepo.findById(new Types.ObjectId(id));
    if (!exists) throw new NotFoundError('Project not found');

    // Check if project belongs to the authenticated user
    if (exists.user.toString() !== req.user._id.toString()) {
      throw new BadRequestError(
        'You do not have permission to update this project',
      );
    }

    const updated = await ProjectRepo.updateById(
      new Types.ObjectId(id),
      req.body,
    );

    new SuccessResponse('Project updated successfully', updated).send(res);
  }),
);

/**
 * @swagger
 * /project/delete/{id}:
 *   delete:
 *     summary: Delete a project by ID
 *     tags: [Project]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
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
 *         description: Not found - Project not found
 */
router.delete(
  '/delete/:id',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { id } = req.params;

    // Check if project exists
    const exists = await ProjectRepo.findById(new Types.ObjectId(id));
    if (!exists) throw new NotFoundError('Project not found');

    // Check if project belongs to the authenticated user
    if (exists.user.toString() !== req.user._id.toString()) {
      throw new BadRequestError(
        'You do not have permission to delete this project',
      );
    }

    await ProjectRepo.deleteById(new Types.ObjectId(id));

    new SuccessResponse('Project deleted successfully', {
      success: true,
    }).send(res);
  }),
);

export default router;
