import { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import Config from "config";
import IUserWithVerification from "../interfaces/IUserWithVerification";
import viewUser from "./viewUser";
import { Response } from "express";

export default function generateAuthToken(
  user: IUserWithVerification,
  res: Response
): string {
  const accessToken = jwt.sign(
    viewUser(user) as object,
    Config.get("jwtPrivateKey") as string,
    { expiresIn: Config.get("accessTokenTtl") }
  );

  const accessTokenCookieOptions: CookieOptions = {
    maxAge: <number>Config.get("accessTokenTtl") * 1000,
    httpOnly: false,
    domain: "localhost",
    path: "/",
    sameSite: "lax",
    secure: false,
  };
  res.cookie("TLAccessToken", accessToken, accessTokenCookieOptions);

  return accessToken;
}
