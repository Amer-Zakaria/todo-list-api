import Joi from "joi";
import IUser from "../interfaces/IUser";
import { codeValidation, emailValidation, passwordValidation } from "./user";

export function validateRequestPasswordReset(
  user: IUser
): Joi.ValidationResult {
  const schema = Joi.object({ email: emailValidation });

  return schema.validate(user, { abortEarly: false });
}

export function validateResetPassword(user: IUser): Joi.ValidationResult {
  const schema = Joi.object({
    code: codeValidation,
    newPassword: passwordValidation,
  });

  return schema.validate(user, { abortEarly: false });
}
