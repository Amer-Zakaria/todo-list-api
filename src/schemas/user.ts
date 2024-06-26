import Joi from "joi";
import { joiPasswordExtendCore } from "joi-password";
import IUserCred from "../interfaces/IUserCred";
import IUser from "../interfaces/IUser";
const joiPassword = Joi.extend(joiPasswordExtendCore);

export const passwordValidation = joiPassword
  .string()
  .min(8)
  .minOfNumeric(2)
  .onlyLatinCharacters()
  .noWhiteSpaces()
  .required();

export const emailValidation = Joi.string().min(5).max(255).email().required();

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
