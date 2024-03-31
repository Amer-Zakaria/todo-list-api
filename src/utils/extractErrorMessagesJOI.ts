import Joi from "joi";

function extractErrorMessagesJOI(err: Joi.ValidationError) {
  const returningError: { [x: string]: string } = {};
  err.details.forEach((detail) => {
    returningError[detail.path[0]] = detail.message;
  });
  return returningError;
}

export default extractErrorMessagesJOI;
