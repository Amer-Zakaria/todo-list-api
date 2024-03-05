import Config from "config";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export default function authz(
  req: Request,
  res: Response,
  next: NextFunction
): any {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = jwt.verify(token, Config.get("jwtPrivateKey"));
    res.locals.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}
