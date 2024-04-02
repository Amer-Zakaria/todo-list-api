import Config from "config";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import constructErrorResponse from "../utils/constructErrorResponse";

export default function authz(
  req: Request,
  res: Response,
  next: NextFunction
): any {
  const accessToken = req.header("x-auth-token");
  if (!accessToken)
    return res.status(401).send(
      constructErrorResponse(new Error(), {
        message: "Access denied. No token provided.",
      })
    );

  try {
    const decoded = jwt.verify(accessToken, Config.get("jwtPrivateKey"));
    res.locals.user = decoded;
    next();
  } catch (ex) {
    //Manipulated token or expiered
    return res
      .status(400)
      .send(constructErrorResponse(new Error(), { message: "Invalid token." }));
  }
}
