import { RoleRequest } from 'app-request';
import express from 'express';
import { BadRequestError } from '../../core/ApiError';
import { SuccessResponse } from '../../core/ApiResponse';
import RoleRepo from '../../database/repository/RoleRepo';
import asyncHandler from '../../helpers/asyncHandler';
import validator from '../../helpers/validator';
import schema from './schema';

const router = express.Router();

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
router.get(
  '/',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const roles = await RoleRepo.findAll();
    new SuccessResponse('Roles Retrieved Successfully', roles).send(res);
  }),
);

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
