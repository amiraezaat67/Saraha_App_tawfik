import Joi from "joi";
import { GeneralRules } from "./index.js";
import { messagePrivacyEnum } from "../../Common/Enums/message.enum.js";

export const profileDataSchema = {
  params: Joi.object({
    // id: Joi.string().hex().length(24),
    id: GeneralRules.objectId,
  }),
};

export const messgaeStatusSchema = {
  body: Joi.object({
    messageState: Joi.string().valid(Object.values(messagePrivacyEnum)).required(),
  }),
  params: Joi.object({
    // messageId: Joi.string().hex().length(24),
    messageId: Joi.custom(objectIdRule),
  }),
};

export const updateSchema = {
  body: Joi.object({
    firstName: Joi.string().min(3).max(10),
    lastName: Joi.string().min(3).max(10),
    email: GeneralRules.email,
    gender: Joi.string().valid("male", "female"),
  }),
};
