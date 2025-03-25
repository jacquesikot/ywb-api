import Joi from 'joi';

export default {
  createApiKey: Joi.object().keys({
    permissions: Joi.array()
      .required()
      .items(Joi.string().valid('GENERAL', 'ADMIN')),
  }),
  createRole: Joi.object().keys({
    code: Joi.string().required().valid('CLIENT', 'FREELANCER', 'BUSINESS'),
  }),
  createSkill: Joi.object().keys({
    name: Joi.string().required(),
  }),
};
