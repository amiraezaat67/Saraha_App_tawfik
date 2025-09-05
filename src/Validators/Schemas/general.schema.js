// Write here all the general schemas like email , password , objectId custom rule

import Joi from "joi";
import { isValidObjectId } from "mongoose";

export const objectIdRule = (val , helper) => isValidObjectId(val) ? true : helper.message("Invalid object id");

export const GeneralRules = {
    email: Joi.string().email(),
    password: Joi.string().min(6).max(30),
    objectId: Joi.custom(objectIdRule),
}