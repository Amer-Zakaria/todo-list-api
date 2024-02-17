import Joi from "joi";
import ITodo from "../interfaces/ITodo";

export default function validateTodo(todo: ITodo): Joi.ValidationResult {
  const schema = Joi.object({
    details: Joi.string(),
  });

  return schema.validate(todo, { abortEarly: false });
}
