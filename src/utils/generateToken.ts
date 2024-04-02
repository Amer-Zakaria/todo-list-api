import jwt from "jsonwebtoken";
import Config from "config";
import IUserWithVerification from "../interfaces/IUserWithVerification";
import viewUser from "./viewUser";
import prisma from "../client";

export default async function generateToken(
  user: IUserWithVerification,
  isRefreshToken?: boolean
) {
  const token = jwt.sign(
    viewUser(user) as object,
    (isRefreshToken
      ? Config.get("refreshJwtPrivateKey")
      : Config.get("jwtPrivateKey")) as string,
    { ...(!isRefreshToken && { expiresIn: Config.get("accessTokenTtl") }) }
  );

  if (isRefreshToken) {
    await prisma.refreshToken.create({ data: { token, userId: user.id } });
  }

  return token;
}
