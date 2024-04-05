import Config from "config";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import constructErrorResponse from "../utils/constructErrorResponse";
import axios from "axios";

export default async function authz(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const accessToken = req.header("x-auth-token");
  const refreshToken = req.header("x-refresh-token");

  if (!accessToken && !refreshToken)
    return res.status(401).send(
      constructErrorResponse(new Error(), {
        message: "Access denied. No token provided.",
      })
    );
  // There's no access token but the user provided a refreshToken
  else if (!accessToken && refreshToken)
    try {
      const response = await axios.post(
        `${Config.get("apiOrigin")}/api/auth/token`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            "x-refresh-token": refreshToken,
          },
        }
      );
      const newAccessToken = response.data;
      res.setHeader("x-auth-token", newAccessToken);
      res.locals.user = jwt.decode(newAccessToken);
      next();
      return;
    } catch (err) {
      return res.sendStatus(403);
    }

  // There's already accessToken
  try {
    const decoded = jwt.verify(
      accessToken as string,
      Config.get("jwtPrivateKey")
    );
    res.locals.user = decoded;
    next();
  } catch (ex) {
    //Manipulated token or expiered
    return res
      .status(400)
      .send(constructErrorResponse(new Error(), { message: "Invalid token." }));
  }
}
