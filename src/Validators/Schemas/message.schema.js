import Joi from "joi";
import { GeneralRules } from "./index.js";

export const sendMessageSchema = {
  body: Joi.object({
    content: Joi.string().required(),
  }),
  /** @comment : Validate any objectId from the mongoose sid - generate custom validation rule? */
  params: Joi.object({
    // receiverId: Joi.string().hex().length(24),
    receiverId: GeneralRules.objectId,
  }),
};
