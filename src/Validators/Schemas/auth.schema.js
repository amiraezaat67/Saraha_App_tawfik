import Joi from "joi";

export const registerationSchema = {
  body: Joi.object({
    firstName: Joi.string().required().min(3).max(10),
    lastName: Joi.string().required().min(3).max(10),
    email: Joi.string().required().email(),
    phoneNumber: Joi.string().required(),
    password: Joi.string().required(),
    gender: Joi.string().valid("male", "female"),
  }),
};

export const confirmSchema = {
  body: Joi.object({
    email: Joi.string().required().email(),
    otp: Joi.number(),
  }),
};

export const loginSchema = {
  body: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

export const forgetPasswordSchema = {
  body: Joi.object({
    email: Joi.string().required().email(),
  }),
};

export const resetPasswordSchema = {
  body: Joi.object({
    newPassword: Joi.string().required(),
    otp: Joi.string(),
  }),
};

export const updatePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
    confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({ "any.only": "Passwords must match" }),
  }),
};
