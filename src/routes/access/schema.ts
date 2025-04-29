import Joi from 'joi';
import { RoleCode } from '../../database/model/Role';
import {
  AvailabilityStatus,
  BusinessType,
  ExperienceLevel,
  PreferredRate,
} from '../../database/model/User';
import { JoiAuthBearer } from '../../helpers/validator';

export default {
  google: Joi.object().keys({
    idToken: Joi.string().required(),
    roleCode: Joi.string()
      .valid(...Object.values(RoleCode))
      .required(),
  }),
  credential: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6),
  }),
  refreshToken: Joi.object().keys({
    refreshToken: Joi.string().required().min(1),
  }),
  auth: Joi.object()
    .keys({
      authorization: JoiAuthBearer().required(),
    })
    .unknown(true),
  signup: Joi.object().keys({
    name: Joi.string().required().min(3),
    role: Joi.string()
      .valid(...Object.values(RoleCode))
      .required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6),
    profilePicUrl: Joi.string().optional(),
  }),
  updateUser: Joi.object({
    name: Joi.string().optional(),
    profilePicUrl: Joi.string().optional().uri(),
    bio: Joi.string().optional(),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/) // E.164 international phone number format
      .message(
        'Phone number must be a valid international format, e.g., +1234567890',
      )
      .optional(),
    location: Joi.object({
      country: Joi.string().required(),
      state: Joi.string().optional(),
      city: Joi.string().optional(),
      address: Joi.string().optional(),
      zipCode: Joi.string().optional(),
    }).optional(),
    companyRole: Joi.string().optional(),
    skills: Joi.array().items(Joi.string()).optional(),
    experienceLevel: Joi.string()
      .valid(
        ExperienceLevel.EXPERT,
        ExperienceLevel.JUNIOR,
        ExperienceLevel.MID,
        ExperienceLevel.SENIOR,
      )
      .optional(),
    portfolioLinks: Joi.array().items(Joi.string().uri()).optional(),
    preferredRate: Joi.object({
      type: Joi.string()
        .valid(PreferredRate.FIXED, PreferredRate.HOURLY)
        .required(),
      rate: Joi.number().positive().required(),
    }).optional(),
    availability: Joi.object({
      status: Joi.string()
        .valid(
          AvailabilityStatus.AVAILABLE,
          AvailabilityStatus.AWAY,
          AvailabilityStatus.BUSY,
        )
        .optional(),
      hoursPerWeek: Joi.string().optional(),
    }).optional(),
    companyName: Joi.string().optional(),
    industry: Joi.string().optional(),
    website: Joi.string().optional().uri(),
    organisationSize: Joi.string().optional(),
    businessType: Joi.string()
      .valid(BusinessType.BUSINESS, BusinessType.PERSONAL)
      .optional(),
    talentPoolPreferences: Joi.array().items(Joi.string()).optional(),
  }),
  updatePassword: Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),
  forgotPassword: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
  resetPassword: Joi.object().keys({
    token: Joi.string().required().min(1),
    password: Joi.string().required().min(6),
  }),
};
