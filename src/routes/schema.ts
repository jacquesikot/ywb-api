import Joi from 'joi';
import {
  BudgetType,
  JobType,
  JobVisibility,
  LocationPreference,
} from '../database/model/Job';

export default {
  createJob: Joi.object().keys({
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().required().min(10),
    category: Joi.string().required(),
    skills: Joi.array().items(Joi.string().required()).min(1).required(),
    budget: Joi.object().keys({
      type: Joi.string().valid(BudgetType.HOURLY, BudgetType.FIXED).required(),
      value: Joi.number(),
      min: Joi.number(),
      max: Joi.number(),
    }),
    locationPreference: Joi.string()
      .valid(LocationPreference.ONSITE, LocationPreference.REMOTE)
      .required(),
    type: Joi.string()
      .valid(JobType.CONTRACT, JobType.FULL_TIME, JobType.PART_TIME)
      .required(),
    timeline: Joi.string().required().max(50),
    resource: Joi.string(),
    additionalQuestions: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string()),
    visibility: Joi.string()
      .valid(JobVisibility.PUBLIC, JobVisibility.PRIVATE)
      .default(JobVisibility.PUBLIC),
    hoursPerWeek: Joi.object().keys({
      value: Joi.string(),
      min: Joi.number().min(1),
      max: Joi.number().max(168),
    }),
  }),
  createWave: Joi.object().keys({
    jobId: Joi.string().required(),
    freelancerId: Joi.string().required(),
  }),
  createChat: Joi.object().keys({
    receiverId: Joi.string().required(),
    message: Joi.string().min(1).required(),
    jobId: Joi.string(),
    waveId: Joi.string(),
  }),
  sendMessage: Joi.object().keys({
    chatId: Joi.string().required(),
    content: Joi.string().min(1).required(),
  }),
  addChatMembers: Joi.object().keys({
    memberIds: Joi.array().items(Joi.string().required()).min(1).required(),
  }),
  readMessages: Joi.object().keys({
    chatId: Joi.string().required(),
  }),
  createKYC: Joi.object().keys({
    taxIdentificationNumber: Joi.string().required(),
    businessAddress: Joi.string(),
    businessLocation: Joi.string(),
    certificateOfIncorporation: Joi.string(),
    businessLicence: Joi.string(),
    proofOfAddress: Joi.string().required(),
    ownershipAndControlInformation: Joi.string(),
    governmentIssuedId: Joi.string(),
  }),
  updateKYC: Joi.object().keys({
    taxIdentificationNumber: Joi.string(),
    businessAddress: Joi.string(),
    businessLocation: Joi.string(),
    certificateOfIncorporation: Joi.string(),
    businessLicence: Joi.string(),
    proofOfAddress: Joi.string(),
    ownershipAndControlInformation: Joi.string(),
    governmentIssuedId: Joi.string(),
  }),
};
