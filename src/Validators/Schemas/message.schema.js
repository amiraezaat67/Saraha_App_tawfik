import Joi from "joi";

export const sendMessageSchema = {
  body: Joi.object({
    content: Joi.string().required(),
  }),
  params: Joi.object({
    receiverId: Joi.string().hex().length(24),
  }),
};
