import Joi from 'joi';
import { BudgetType, JobType, LocationPreference } from '../database/model/Job';

export default {
  createJob: Joi.object().keys({
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().required().min(10),
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
    resource: Joi.object().keys({
      figma: Joi.string().uri(),
      zeplin: Joi.string().uri(),
      invision: Joi.string().uri(),
      marvel: Joi.string().uri(),
      dropbox: Joi.string().uri(),
      googleDrive: Joi.string().uri(),
      box: Joi.string().uri(),
      github: Joi.string().uri(),
      other: Joi.string().uri(),
    }),
    hoursPerWeek: Joi.number().min(1).max(168),
  }),
  createWave: Joi.object().keys({
    jobId: Joi.string().required(),
    freelancerId: Joi.string().required(),
  }),
  createChat: Joi.object().keys({
    jobId: Joi.string().required(),
    userId: Joi.string().required(),
    message: Joi.string().min(1).required(),
    waveId: Joi.string().required(),
  }),
  sendMessage: Joi.object().keys({
    chatId: Joi.string().required(),
    userId: Joi.string().required(),
    content: Joi.string().min(1).required(),
  }),
};
