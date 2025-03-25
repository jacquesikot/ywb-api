import { ProtectedRequest } from 'app-request';
import express from 'express';
import Fuse from 'fuse.js';
import authentication from '../auth/authentication';
import { JobModel } from '../database/model/Job';
import { RoleCode } from '../database/model/Role';
import { UserModel } from '../database/model/User';
import asyncHandler from '../helpers/asyncHandler';

const router = express.Router();

router.use(authentication);

router.get(
  '/',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { role, skills, talentPoolPreferences } = req.user;
    let result;

    const fuseOption = {
      keys: ['title', 'description', 'skillsRequired'],
      threshold: 0.3,
    };

    // const userRole = role.map((r) => r.code);

    // if (userRole.includes(RoleCode.FREELANCER)) {
    //   const jobs = await JobModel.find({
    //     skillsRequired: {
    //       $in: skills?.map((skill) => new RegExp(`^${skill.name}$`, 'i')) || [],
    //     },
    //   });
    //   const fuse = new Fuse(jobs, fuseOption);
    //   const skillNames = skills?.map((skill) => skill.name) || [];
    //   const fuzzyResults =
    //     skillNames.length > 0 ? fuse.search(skillNames.join(' ')) : [];
    //   result = fuzzyResults.map((res) => res.item);
    // } else if (userRole.includes(RoleCode.CLIENT)) {
    //   const jobs = await JobModel.find({
    //     skillsRequired: { $in: talentPoolPreferences?.map((tp) => tp.name) },
    //   });
    //   const talentPool = await UserModel.find({
    //     skills: { $in: talentPoolPreferences?.map((tp) => tp.name) },
    //   });
    //   result = { jobs, talentPool };
    // } else if (userRole.includes(RoleCode.BUSINESS)) {
    //   result = await UserModel.find({
    //     skills: { $in: talentPoolPreferences?.map((tp) => tp.name) },
    //   });
    // }
    return res.json({
      message: 'Jobs and talent pool retrieved successfully',
      data: { result },
    });
  }),
);

export default router;
