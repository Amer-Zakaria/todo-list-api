import jwt from "jsonwebtoken";
import Config from "config";
import IUserWithVerification from "../interfaces/IUserWithVerification";
import viewUser from "./viewUser";

export default function generateAuthToken(user: IUserWithVerification): string {
  const token = jwt.sign(viewUser(user), Config.get("jwtPrivateKey"));
  return token;
}
