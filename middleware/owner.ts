import { Request, Response, NextFunction } from "express";
import constructErrorResponse from "../utils/constructErrorResponse";

// this middle is for ensuring that the user who's trying
// to update a todo then his the owner of it
// it comes after the authz and validateId middlwares to ensure we got
// userId and targetedTodoUserId

export default function owner(
  req: Request,
  res: Response,
  next: NextFunction
): any {
  const userId = res.locals.user.id;
  const targetedTodoUserId = res.locals.record.userId;

  if (userId !== targetedTodoUserId)
    return res
      .status(403)
      .send(
        constructErrorResponse(new Error(), { message: "This isn't your todo" })
      );

  next();
}
