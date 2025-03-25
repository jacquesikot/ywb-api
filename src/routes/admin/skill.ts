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

router.get(
  '/',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const skills = await SkillRepo.findAll();
    new SuccessResponse('Skills Retrieved Successfully', skills).send(res);
  }),
);

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
