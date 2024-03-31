import { Request, Response, NextFunction } from "express";
import { logger } from "../index";
import constructErrorResponse from "../utils/constructErrorResponse";

export default function (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(err);

  res
    .status(500)
    .send(
      constructErrorResponse(err, { message: "Unexpected Error Occured." })
    );
}
