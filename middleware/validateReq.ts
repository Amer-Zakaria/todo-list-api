import { NextFunction, Request, Response } from "express";
import { isErrorWithStack } from "..";
import extractErrorMessagesJOI from "../utils/extractErrorMessagesJOI";

export default function validateReq(
  validationFunction: Function,
  part: "body" | "query"
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    const result = validationFunction(req[part]);
    if (result.error) {
      return res.status(400).json({
        validation: extractErrorMessagesJOI(result.error),
        ...(isErrorWithStack && { stack: new Error("").stack }),
      });
    }

    next();
  };
}
