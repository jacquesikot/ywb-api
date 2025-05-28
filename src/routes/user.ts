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
import { getSkillsFromUser } from '../database/repository/JobRepo';
import asyncHandler from '../helpers/asyncHandler';
import validator from '../helpers/validator';
import schema from './access/schema';
import WaveRepo from '../database/repository/WaveRepo'; // Import WaveRepo for top talents endpoint
import EducationRepo from '../database/repository/EducationRepo';
import WorkHistoryRepo from '../database/repository/WorkHistoryRepo';
import CertificateRepo from '../database/repository/CertificateRepo';
import ProjectRepo from '../database/repository/ProjectRepo';
import KYCRepo from '../database/repository/KYCRepo';

const router = express.Router();

router.use(authentication);

/**
 * @swagger
 * /user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               profilePicUrl:
 *                 type: string
 *               phone:
 *                 type: string
 *               bio:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                   state:
 *                     type: string
 *                   city:
 *                     type: string
 *                   address:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *               jobRole:
 *                 type: string
 *               companyRole:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               talentPoolPreferences:
 *                 type: array
 *                 items:
 *                   type: string
 *               experienceLevel:
 *                 type: string
 *               portfolioLinks:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferredRate:
 *                 type: number
 *               availability:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum:
 *                       - FULLTIME
 *                       - CONTRACT
 *                       - REMOTE
 *                       - HYBRID
 *                   hoursPerWeek:
 *                     type: string
 *               companyName:
 *                 type: string
 *               industry:
 *                 type: string
 *               website:
 *                 type: string
 *               organisationSize:
 *                 type: string
 *               businessType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *         description: Bad request - User not registered or invalid data
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.put(
  '/profile',
  validator(schema.updateUser),
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    const user = await UserRepo.findPrivateProfileById(userId);
    if (!user) throw new BadRequestError('User not registered');

    if (req.body.name) user.name = req.body.name;
    if (req.body.profilePicUrl) user.profilePicUrl = req.body.profilePicUrl;
    if (req.body.jobRole) user.jobRole = req.body.jobRole;
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

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *                     profilePicUrl:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     location:
 *                       type: string
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Bad request - User not registered
 *       401:
 *         description: Unauthorized - Invalid token
 */
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

/**
 * @swagger
 * /user/password:
 *   put:
 *     summary: Update user password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password updated successfully
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
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       400:
 *         description: Bad request - User not found or credential not set
 *       401:
 *         description: Authentication failure - Incorrect current password
 */
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

/**
 * @swagger
 * /user/talents:
 *   get:
 *     summary: Get users with matching skills
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users with matching skills retrieved successfully
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
 *       400:
 *         description: Bad request - User not registered
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/talents/match',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    const user = await UserRepo.findPrivateProfileById(userId);
    if (!user) throw new BadRequestError('User not registered');

    // Get combined skills from user's skills and talentPoolPreferences
    const userSkills = getSkillsFromUser(user);

    // Extract skill IDs
    const skillIds = userSkills.map((skill) => skill._id);

    // Find users with matching skills
    const matchingUsers = await UserRepo.findUsersWithMatchingSkills(
      skillIds,
      userId,
    );

    return new SuccessResponse(
      'Talents retrieved successfully',
      matchingUsers,
    ).send(res);
  }),
);

/**
 * @swagger
 * /user/talents/top-talents:
 *   get:
 *     summary: Get top freelancers sorted by number of waves
 *     tags: [User]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top talents to return
 *       - in: query
 *         name: skills
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Skills to filter by (comma-separated list)
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country to filter by
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State to filter by
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City to filter by
 *     responses:
 *       200:
 *         description: Top talents retrieved successfully
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
  '/talents/top-talents',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    // Parse skills filter (expects a comma-separated list)
    const skills = req.query.skills
      ? (req.query.skills as string).split(',')
      : undefined;

    // Parse location filter
    const location: {
      country?: string;
      state?: string;
      city?: string;
    } = {};

    if (req.query.country) location.country = req.query.country as string;
    if (req.query.state) location.state = req.query.state as string;
    if (req.query.city) location.city = req.query.city as string;

    // Build filters object
    const filters: {
      skills?: string[];
      location?: {
        country?: string;
        state?: string;
        city?: string;
      };
    } = {};

    if (skills && skills.length > 0) filters.skills = skills;
    if (Object.keys(location).length > 0) filters.location = location;

    // Find top freelancers by wave count with filters
    const topTalents = await WaveRepo.findTopFreelancersByWaves(limit, filters);

    // Populate skills for each talent
    const populatedTopTalents = await Promise.all(
      topTalents.map(async (talent) => {
        // If we've already looked up skill details (through filtering),
        if (talent.skillDetails && talent.skillDetails.length > 0) {
          return {
            ...talent,
            skills: talent.skillDetails,
            skillDetails: undefined,
            location: talent.location || null, // Ensure location is included
          };
        }

        // Otherwise, look up skills by IDs as before
        if (talent.skills && talent.skills.length > 0) {
          const skillIds = talent.skills.map(
            (skillId: Types.ObjectId) => new Types.ObjectId(skillId),
          );
          const skills = await SkillRepo.findByIds(skillIds);
          return {
            ...talent,
            skills,
            location: talent.location || null, // Ensure location is included
          };
        }

        return {
          ...talent,
          location: talent.location || null, // Ensure location is included
        };
      }),
    );

    return new SuccessResponse(
      'Top talents retrieved successfully',
      populatedTopTalents,
    ).send(res);
  }),
);

/**
 * @swagger
 * /user/talents:
 *   get:
 *     summary: Get all users with role of freelancer or client
 *     tags: [User]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: skills
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Skills to filter by (comma-separated list of skill IDs)
 *       - in: query
 *         name: experienceLevel
 *         schema:
 *           type: string
 *         description: Experience level to filter by
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country to filter by
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State to filter by
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City to filter by
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/talents',
  asyncHandler(async (req: ProtectedRequest, res) => {
    // Parse pagination parameters
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    // Parse skills filter (expects a comma-separated list)
    const skills = req.query.skills
      ? (req.query.skills as string).split(',')
      : undefined;

    // Parse experience level filter
    const experienceLevel = req.query.experienceLevel as string | undefined;

    // Parse location filter
    const location: {
      country?: string;
      state?: string;
      city?: string;
    } = {};

    if (req.query.country) location.country = req.query.country as string;
    if (req.query.state) location.state = req.query.state as string;
    if (req.query.city) location.city = req.query.city as string;

    // Build filters object
    const filters: {
      skills?: string[];
      experienceLevel?: string;
      location?: {
        country?: string;
        state?: string;
        city?: string;
      };
    } = {};

    if (skills && skills.length > 0) filters.skills = skills;
    if (experienceLevel) filters.experienceLevel = experienceLevel;
    if (Object.keys(location).length > 0) filters.location = location;

    // Get users with roles 'FREELANCER' or 'CLIENT'
    const { users, total } = await UserRepo.findUsersByRole(
      ['FREELANCER', 'CLIENT'],
      filters,
      { page, limit },
    );

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    return new SuccessResponse('Users retrieved successfully', {
      users,
      total,
      page,
      limit,
      pages,
    }).send(res);
  }),
);

/**
 * @swagger
 * /user/talents/top-talents/{talentId}:
 *   get:
 *     summary: Get detailed information about a specific talent
 *     tags: [User]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: talentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the talent to retrieve
 *     responses:
 *       200:
 *         description: Talent information retrieved successfully
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
 *                     email:
 *                       type: string
 *                     profilePicUrl:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     location:
 *                       type: object
 *                     skills:
 *                       type: array
 *                     workHistory:
 *                       type: array
 *                     education:
 *                       type: array
 *                     certificates:
 *                       type: array
 *                     portfolioLinks:
 *                       type: array
 *                     preferredRate:
 *                       type: number
 *                     experienceLevel:
 *                       type: string
 *                     availability:
 *                       type: object
 *                     companyRole:
 *                       type: string
 *                     industry:
 *                       type: string
 *                     website:
 *                       type: string
 *       400:
 *         description: Bad request - Talent not found
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/talents/top-talents/:talentId',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { talentId } = req.params;

    // Validate talentId
    if (!Types.ObjectId.isValid(talentId)) {
      throw new BadRequestError('Invalid talent ID');
    }

    const talentObjectId = new Types.ObjectId(talentId);

    // Get detailed talent information using findById
    const talent = await UserRepo.findById(talentObjectId);

    if (!talent) {
      throw new BadRequestError('Talent not found');
    }

    // Get talent's skills
    let skills: any[] = [];
    if (talent.skills && talent.skills.length > 0) {
      const skillIds = talent.skills.map(
        (skillId) => new Types.ObjectId(skillId.toString()),
      );
      skills = await SkillRepo.findByIds(skillIds);
    }

    // Get talent's work history

    const workHistory = await WorkHistoryRepo.findByUser(talentObjectId);

    // Get talent's education

    const education = await EducationRepo.findByUser(talentObjectId);

    // Get talent's certificates

    const certificates = await CertificateRepo.findByUser(talentObjectId);

    // Get talent's projects
    const projects = await ProjectRepo.findByUser(talentObjectId);

    // Prepare the response data
    const talentData = {
      _id: talent._id,
      name: talent.name,
      email: talent.email,
      profilePicUrl: talent.profilePicUrl,
      bio: talent.bio,
      location: talent.location,
      skills: skills,
      workHistory: workHistory,
      education: education,
      certificates: certificates,
      projects: projects,
      portfolioLinks: talent.portfolioLinks,
      preferredRate: talent.preferredRate,
      experienceLevel: talent.experienceLevel,
      availability: {
        status: talent.availability?.status || null,
        hoursPerWeek: talent.availability?.hoursPerWeek || null,
      },
      companyRole: talent.companyRole,
      industry: talent.industry,
      website: talent.website,
    };

    return new SuccessResponse(
      'Talent information retrieved successfully',
      talentData,
    ).send(res);
  }),
);

/**
 * @swagger
 * /user/onboarding-status:
 *   get:
 *     summary: Get user onboarding status
 *     tags: [User]
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User onboarding status retrieved successfully
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
 *                     bioRoleLocation:
 *                       type: boolean
 *                     skillsTools:
 *                       type: boolean
 *                     workExperience:
 *                       type: boolean
 *                     projects:
 *                       type: boolean
 *                     education:
 *                       type: boolean
 *                     certification:
 *                       type: boolean
 *                     socialLinks:
 *                       type: boolean
 *       400:
 *         description: Bad request - User not registered
 *       401:
 *         description: Unauthorized - Invalid token
 */
router.get(
  '/onboarding-status',
  asyncHandler(async (req: ProtectedRequest, res) => {
    const { _id } = req.user;
    const userId = new Types.ObjectId(_id);

    // Get user profile
    const user = await UserRepo.findPrivateProfileById(userId);
    if (!user) throw new BadRequestError('User not registered');

    // Get additional user data
    const workHistory = await WorkHistoryRepo.findByUser(userId);
    const projects = await ProjectRepo.findByUser(userId);
    const education = await EducationRepo.findByUser(userId);
    const certificates = await CertificateRepo.findByUser(userId);
    const kyc = await KYCRepo.findByUser(userId);

    // Determine completion status for each section
    const onboardingStatus = {
      bioRoleLocation: !!(
        user.bio &&
        user.companyRole &&
        user.jobRole &&
        user.location &&
        Object.keys(user.location).length > 0
      ),
      skillsTools: !!(user.skills && user.skills.length > 0),
      workExperience: !!(workHistory && workHistory.length > 0),
      projects: !!(projects && projects.length > 0),
      education: !!(education && education.length > 0),
      certification: !!(certificates && certificates.length > 0),
      kyc: !!kyc,
    };

    return new SuccessResponse(
      'Onboarding status retrieved successfully',
      onboardingStatus,
    ).send(res);
  }),
);

export default router;
