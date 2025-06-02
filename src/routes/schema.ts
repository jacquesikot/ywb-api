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
import { MessageType } from '../database/model/Message';

export default {
  createJob: Joi.object().keys({
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().required().min(10),
    category: Joi.array().items(Joi.string().optional()).optional(),
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
    type: Joi.string()
      .valid(
        MessageType.TEXT,
        MessageType.IMAGE,
        MessageType.AUDIO,
        MessageType.VIDEO,
        MessageType.FILE,
      )
      .required(),
    audioUrl: Joi.string().optional(),
    imageUrl: Joi.string().optional(),
    videoUrl: Joi.string().optional(),
    fileUrl: Joi.string().optional(),
    fileName: Joi.string().optional(),
    fileType: Joi.string().optional(),
    fileSize: Joi.number().optional(),
    fileExtension: Joi.string().optional(),
  }),
  addChatMembers: Joi.object().keys({
    memberIds: Joi.array().items(Joi.string().required()).min(1).required(),
  }),
  readMessages: Joi.object().keys({
    chatId: Joi.string().required(),
  }),
  createKYC: Joi.object().keys({
    country: Joi.string().optional(),
    documentType: Joi.string().optional(),
    documentUrl: Joi.string().optional(),
    taxIdentificationNumber: Joi.string().optional(),
    businessAddress: Joi.string(),
    businessLocation: Joi.string(),
    certificateOfIncorporation: Joi.string(),
    businessLicence: Joi.string(),
    proofOfAddress: Joi.string().optional(),
    ownershipAndControlInformation: Joi.string(),
    governmentIssuedId: Joi.string(),
  }),
  updateKYC: Joi.object().keys({
    country: Joi.string().optional(),
    documentType: Joi.string().optional(),
    documentUrl: Joi.string().optional(),
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
  workHistory: {
    create: Joi.object().keys({
      title: Joi.string().required(),
      company: Joi.string().required(),
      location: Joi.string(),
      website: Joi.string(),
      startYear: Joi.string().required(),
      endYear: Joi.string().when('currentlyWorkHere', {
        is: false,
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      currentlyWorkHere: Joi.boolean().default(false),
      description: Joi.string(),
    }),
    update: Joi.object().keys({
      title: Joi.string(),
      company: Joi.string(),
      location: Joi.string(),
      website: Joi.string(),
      startYear: Joi.string(),
      endYear: Joi.string().when('currentlyWorkHere', {
        is: false,
        then: Joi.string(),
        otherwise: Joi.string().optional().allow(null, ''),
      }),
      currentlyWorkHere: Joi.boolean(),
      description: Joi.string(),
    }),
  },
  certificate: {
    create: Joi.object().keys({
      name: Joi.string().required(),
      certificateFile: Joi.string().required(),
      issuedBy: Joi.string().required(),
      website: Joi.string(),
      yearIssued: Joi.string().required(),
      expiration: Joi.string(),
    }),
    update: Joi.object().keys({
      name: Joi.string(),
      certificateFile: Joi.string(),
      issuedBy: Joi.string(),
      website: Joi.string(),
      yearIssued: Joi.string(),
      expiration: Joi.string(),
    }),
  },
  project: {
    create: Joi.object().keys({
      title: Joi.string().required().min(3).max(100),
      description: Joi.string().required().min(5),
      tags: Joi.array().items(Joi.string()).required().min(1),
      thumbnail: Joi.string().optional(),
      images: Joi.array().items(Joi.string()).optional(),
    }),
    update: Joi.object().keys({
      title: Joi.string().min(3).max(100),
      description: Joi.string().min(10),
      tags: Joi.array().items(Joi.string()),
      thumbnail: Joi.string(),
      images: Joi.array().items(Joi.string()),
    }),
  },
  proposal: {
    create: Joi.object().keys({
      job: Joi.string().required(),
      pricingMode: Joi.string().valid('fixed', 'hourly').required(),
      amount: Joi.number().positive().required(),
      coverLetter: Joi.string().required(),
      milestones: Joi.array()
        .items(
          Joi.object().keys({
            name: Joi.string().required(),
            description: Joi.string().required(),
            deliverables: Joi.array().items(Joi.string()).min(1).required(),
            dueDate: Joi.date().greater('now').required(),
          }),
        )
        .min(1)
        .required(),
    }),
    update: Joi.object().keys({
      pricingMode: Joi.string().valid('fixed', 'hourly'),
      amount: Joi.number().positive(),
      status: Joi.string().valid(
        'pending',
        'accepted',
        'rejected',
        'completed',
      ),
    }),
  },
  milestone: {
    update: Joi.object().keys({
      name: Joi.string(),
      description: Joi.string(),
      deliverables: Joi.array().items(Joi.string()).min(1),
      dueDate: Joi.date().greater('now'),
      status: Joi.string().valid('pending', 'in_progress', 'completed'),
    }),
    updateStatus: Joi.object().keys({
      status: Joi.string()
        .valid('pending', 'in_progress', 'completed')
        .required(),
    }),
  },
  offer: {
    create: Joi.object().keys({
      jobId: Joi.string().required(),
      freelancerId: Joi.string().required(),
      message: Joi.string(),
    }),
  },
};
