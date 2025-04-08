import { SkillRequest } from 'app-request';
import express from 'express';
import { BadRequestError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';
import SkillRepo from '../../database/repository/SkillRepo';
import asyncHandler from '../../helpers/asyncHandler';
import validator from '../../helpers/validator';
import schema from './schema';
import validateIdParam from '../../helpers/paramIdValidator';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Skills
 *     description: Skill management for administrators
 */

/**
 * @swagger
 * /admin/skill:
 *   post:
 *     summary: Create a new skill
 *     tags: [Admin - Skills]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the skill
 *     responses:
 *       200:
 *         description: Skill created successfully
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
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Bad request - Skill already exists
 *       401:
 *         description: Unauthorized - Invalid token
 *       403:
 *         description: Forbidden - Not an admin
 */
router.post(
  '/',
  validator(schema.createSkill),
  asyncHandler(async (req: SkillRequest, res) => {
    const skillExist = await SkillRepo.findByName(req.body.name);
    if (skillExist) throw new BadRequestError('Skill already exists');

    const newSkill = await SkillRepo.create({ name: req.body.name });
    if (newSkill)
      new SuccessResponse('Skill Created Successfully', newSkill).send(res);
  }),
);

/**
 * @swagger
 * /admin/skill:
 *   get:
 *     summary: Get all skills
 *     tags: [Admin - Skills]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skills retrieved successfully
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
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *       401:
 *         description: Unauthorized - Invalid token
 *       403:
 *         description: Forbidden - Not an admin
 */
router.get(
  '/',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const skills = await SkillRepo.findAll();
    new SuccessResponse('Skills Retrieved Successfully', skills).send(res);
  }),
);

/**
 * @swagger
 * /admin/skill/{id}:
 *   delete:
 *     summary: Delete a skill
 *     tags: [Admin - Skills]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the skill to delete
 *     responses:
 *       200:
 *         description: Skill deleted successfully
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
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Bad request - Skill not found
 *       401:
 *         description: Unauthorized - Invalid token
 *       403:
 *         description: Forbidden - Not an admin
 */
router.delete(
  '/:id',
  asyncHandler(async (req: SkillRequest, res) => {
    const skillId = req.params.id;
    const skill = await SkillRepo.findById(skillId);
    if (!skill) throw new BadRequestError('Skill not found');
    await SkillRepo.deleteById(skillId);
    new SuccessResponse('Skill Deleted Successfully', skill).send(res);
  }),
);

export default router;
