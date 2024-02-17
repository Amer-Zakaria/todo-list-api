import { Request, Response, NextFunction } from "express";
import { isErrorWithStack } from "..";
import { logger } from "../";

export default function (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(err);

  res.status(500).send({
    message: "Something faild.",
    ...(isErrorWithStack && {
      err: { message: err.message, stack: err.stack },
    }),
  });
}
