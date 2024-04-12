import Joi from "joi";
import IUser from "../interfaces/IUser";
import { emailValidation, passwordValidation } from "./user";

export function validateRequestPasswordReset(
  user: IUser
): Joi.ValidationResult {
  const schema = Joi.object({ email: emailValidation });

  return schema.validate(user, { abortEarly: false });
}

export function validateResetPassword(user: IUser): Joi.ValidationResult {
  const schema = Joi.object({
    token: Joi.string()
      .required()
      .regex(/^[\w-]+\.[\w-]+\.[\w-]+$/),
    newPassword: passwordValidation,
  });

  return schema.validate(user, { abortEarly: false });
}
