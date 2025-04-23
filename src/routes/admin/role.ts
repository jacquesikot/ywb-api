import { RoleRequest } from 'app-request';
import express from 'express';
import { BadRequestError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';
import RoleRepo from '../../database/repository/RoleRepo';
import asyncHandler from '../../helpers/asyncHandler';
import validator from '../../helpers/validator';
import schema from './schema';

const router = express.Router();

/**
 * @swagger
 * /admin/role:
 *   post:
 *     summary: Create a new role
 *     tags: [Admin, Role]
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
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Role code
 *     responses:
 *       200:
 *         description: Role created successfully
 *       400:
 *         description: Role already exists
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.post(
  '/',
  validator(schema.createRole),
  asyncHandler(async (req: RoleRequest, res) => {
    const roleExist = await RoleRepo.findByCode(req.body.code);
    if (roleExist) throw new BadRequestError('Role already created');
    const newRole = await RoleRepo.create({ code: req.body.code });
    if (newRole)
      new SuccessResponse('Role Created Successfully', newRole).send(res);
  }),
);

/**
 * @swagger
 * /admin/role:
 *   get:
 *     summary: Get all roles
 *     tags: [Admin, Role]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const roles = await RoleRepo.findAll();
    new SuccessResponse('Roles Retrieved Successfully', roles).send(res);
  }),
);

/**
 * @swagger
 * /admin/role/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Admin, Role]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       400:
 *         description: Role not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.delete(
  '/:id',
  asyncHandler(async (req: RoleRequest, res) => {
    const roleId = req.params.id;
    const role = await RoleRepo.findById(roleId);
    if (!role) throw new BadRequestError('Role not found');
    await RoleRepo.deleteById(roleId);
    new SuccessResponse('Role Deleted Successfully', role).send(res);
  }),
);
export default router;
