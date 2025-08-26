import Joi from "joi";

export const profileDataSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24),
  }),
};

export const messgaeStatusSchema = {
  body: Joi.object({
    messageState: Joi.string().valid("private", "public").required(),
  }),
  params: Joi.object({
    messageId: Joi.string().hex().length(24),
  }),
};

export const updateSchema = {
  body: Joi.object({
    firstName: Joi.string().min(3).max(10),
    lastName: Joi.string().min(3).max(10),
    email: Joi.string().email(),
    gender: Joi.string().valid("male", "female"),
  }),
};
