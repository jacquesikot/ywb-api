import { ProtectedRequest } from 'app-request';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import express from 'express';
import { Types } from 'mongoose';
import authentication from '../auth/authentication';
import { createTokens } from '../auth/authUtils';
import { AuthFailureError, BadRequestError } from '../core/ApiError';
import { SuccessResponse } from '../core/ApiResponse';
import KeystoreRepo from '../database/repository/KeystoreRepo';
import SkillRepo from '../database/repository/SkillRepo'; // Import SkillRepo to fetch skill ObjectIds
import UserRepo from '../database/repository/UserRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import schema from './access/schema';

const router = express.Router();

router.use(authentication);

router.put(
  '/profile',
  validator(schema.updateUser),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    const user = await UserRepo.findPrivateProfileById(userId);
    if (!user) throw new BadRequestError('User not registered');

    if (req.body.name) user.name = req.body.name;
    if (req.body.username) user.username = req.body.username;
    if (req.body.profilePicUrl) user.profilePicUrl = req.body.profilePicUrl;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.bio) user.bio = req.body.bio;
    if (req.body.location) user.location = req.body.location;
    if (req.body.companyRole) user.companyRole = req.body.companyRole;

    if (req.body.skills) {
      const skillIds = await Promise.all(
        req.body.skills.map(async (skillName: string) => {
          const skill = await SkillRepo.findByName(skillName);
          if (!skill)
            throw new BadRequestError(`Skill '${skillName}' not found`);
          return skill._id;
        }),
      );
      user.skills = skillIds;
    }

    if (req.body.talentPoolPreferences) {
      const skillIds = await Promise.all(
        req.body.talentPoolPreferences.map(async (skillName: string) => {
          const skill = await SkillRepo.findByName(skillName);
          if (!skill)
            throw new BadRequestError(`Skill '${skillName}' not found`);
          return skill._id;
        }),
      );
      user.talentPoolPreferences = skillIds;
    }

    if (req.body.experienceLevel)
      user.experienceLevel = req.body.experienceLevel;
    if (req.body.portfolioLinks) user.portfolioLinks = req.body.portfolioLinks;
    if (req.body.preferredRate) user.preferredRate = req.body.preferredRate;
    if (req.body.availability) user.availability = req.body.availability;
    if (req.body.companyName) user.companyName = req.body.companyName;
    if (req.body.industry) user.industry = req.body.industry;
    if (req.body.website) user.website = req.body.website;
    if (req.body.organisationSize)
      user.organisationSize = req.body.organisationSize;
    if (req.body.businessType) user.businessType = req.body.businessType;

    await UserRepo.updateInfo(user);
    return new SuccessResponse('Profile updated', req.body).send(res);
  }),
);

router.get(
  '/profile',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    const user = await UserRepo.findPrivateProfileById(userId);
    if (!user) throw new BadRequestError('User not registered');

    return new SuccessResponse('success', user).send(res);
  }),
);

router.put(
  '/password',
  validator(schema.updatePassword),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { currentPassword, newPassword } = req.body;
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    const user = await UserRepo.findById(userId);
    if (!user) throw new BadRequestError('User not found');
    if (!user.password) throw new BadRequestError('Credential not set');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AuthFailureError('Incorrect current password');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await UserRepo.updateInfo(user);

    await KeystoreRepo.removeByUser(user._id);
    const accessTokenKey = crypto.randomBytes(64).toString('hex');
    const refreshTokenKey = crypto.randomBytes(64).toString('hex');
    await KeystoreRepo.create(user, accessTokenKey, refreshTokenKey);
    const tokens = await createTokens(user, accessTokenKey, refreshTokenKey);

    new SuccessResponse('Password updated successfully', {
      tokens,
    }).send(res);
  }),
);

export default router;
