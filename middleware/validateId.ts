import { NextFunction, Request, Response } from "express";
import { isErrorWithStack } from "..";
import prisma from "../prisma/client";

export default function validateId(model: any) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    const id = +req.params.id;

    // check the id validity
    if (isNaN(id) || id <= 0 || id > 99999999999999)
      return res.status(400).json({
        validation: { id: `Invalid Id: ${id}` },
        ...(isErrorWithStack && { stack: new Error("").stack }),
      });

    //check if the record exists
    const record = await model.findUnique({
      where: { id },
    });
    if (!record) {
      return res.status(404).json({
        message: "Not found!",
        ...(isErrorWithStack && { stack: new Error("").stack }),
      });
    }

    //put the record in the req
    res.locals.record = record;
    next();
  };
}
