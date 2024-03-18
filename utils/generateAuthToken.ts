import { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import Config from "config";
import IUserWithVerification from "../interfaces/IUserWithVerification";
import viewUser from "./viewUser";

export default function generateAuthToken(user: IUserWithVerification): string {
  const accessToken = jwt.sign(
    viewUser(user) as object,
    Config.get("jwtPrivateKey") as string,
    { expiresIn: Config.get("accessTokenTtl") }
  );

  return accessToken;
}
