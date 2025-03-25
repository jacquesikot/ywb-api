import { RoleRequest } from 'app-request';
import express from 'express';
import asyncHandler from '../../helpers/asyncHandler';
import validator from '../../helpers/validator';
import schema from './schema';
import ApiKeyRepo from '../../database/repository/ApiKeyRepo';
import { SuccessResponse } from '../../core/ApiResponse';

const router = express.Router();

router.post(
  '/',
  validator(schema.createApiKey),
  asyncHandler(async (req: RoleRequest, res) => {
    const newApiKey = await ApiKeyRepo.create(req.body.permissions);
    new SuccessResponse('API Key Created', newApiKey).send(res);
  }),
);

router.get(
  '/',
  asyncHandler(async (req: RoleRequest, res) => {
    const apiKeys = await ApiKeyRepo.findAll();
    new SuccessResponse('Success', apiKeys).send(res);
  }),
);

export default router;
