import Joi from "joi";
import { joiPasswordExtendCore } from "joi-password";
import IUserCred from "../interfaces/IUserCred";
import IUser from "../interfaces/IUser";
const joiPassword = Joi.extend(joiPasswordExtendCore);

export const passwordValidation = joiPassword
  .string()
  .minOfSpecialCharacters(1)
  .minOfLowercase(2)
  .minOfUppercase(2)
  .minOfNumeric(2)
  .noWhiteSpaces()
  .required();

export const emailValidation = Joi.string().min(5).max(255).email().required();

export const codeLength = 6;

export const codeValidation = Joi.string().required().length(codeLength);

export const expiresAt = () => new Date(Date.now() + 2 * 60 * 60 * 1000);

export default function validateUser(user: IUser): Joi.ValidationResult {
  const schema = Joi.object({
    name: Joi.string().min(5).max(255).required(),
    email: emailValidation,
    password: passwordValidation,
  });

  return schema.validate(user, { abortEarly: false });
}

export function validateUserCredentials(userCred: IUserCred) {
  const schema = Joi.object({
    email: emailValidation,
    password: passwordValidation,
  });

  return schema.validate(userCred, { abortEarly: false });
}

export function validateVerifyEmail(userCred: IUserCred) {
  const schema = Joi.object({
    code: codeValidation,
  });

  return schema.validate(userCred, { abortEarly: false });
}
