import Joi from 'joi';
import {
  BudgetType,
  JobType,
  JobVisibility,
  LocationPreference,
} from '../database/model/Job';
import {
  SubscriptionInterval,
  SubscriptionPlan,
} from '../database/model/Subscription';
import { WaveStatus } from '../database/model/Wave';

export default {
  createJob: Joi.object().keys({
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().required().min(10),
    category: Joi.string().required(),
    skills: Joi.array().items(Joi.string().required()).min(1).required(),
    budget: Joi.object().keys({
      type: Joi.string()
        .valid(
          BudgetType.HOURLY,
          BudgetType.FIXED,
          BudgetType.WEEKLY,
          BudgetType.MONTHLY,
        )
        .required(),
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
      min: Joi.number().min(0),
      max: Joi.number().max(168),
    }),
  }),
  createWave: Joi.object().keys({
    jobId: Joi.string().required(),
    freelancerId: Joi.string().optional(),
  }),
  updateWaveStatus: Joi.object().keys({
    status: Joi.string()
      .valid(WaveStatus.WAVED, WaveStatus.ACCEPTED, WaveStatus.REJECTED)
      .required(),
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
  subscription: {
    create: Joi.object().keys({
      plan: Joi.string()
        .valid(...Object.values(SubscriptionPlan))
        .required(),
      interval: Joi.string()
        .valid(...Object.values(SubscriptionInterval))
        .required(),
    }),
    id: Joi.object().keys({
      id: Joi.string().required().min(24).max(24),
    }),
  },
  favorite: {
    add: Joi.object().keys({
      jobId: Joi.string().required(),
    }),
    remove: Joi.object().keys({
      jobId: Joi.string().required(),
    }),
  },
  education: {
    create: Joi.object().keys({
      degree: Joi.string().required(),
      fieldOfStudy: Joi.string().required(),
      institutionName: Joi.string().required(),
      location: Joi.string(),
      institutionWebsite: Joi.string(),
      startYear: Joi.number().required(),
      endYear: Joi.number(),
      description: Joi.string(),
    }),
    update: Joi.object().keys({
      degree: Joi.string(),
      fieldOfStudy: Joi.string(),
      institutionName: Joi.string(),
      location: Joi.string(),
      institutionWebsite: Joi.string(),
      startYear: Joi.number(),
      endYear: Joi.number(),
      description: Joi.string(),
    }),
  },
};
