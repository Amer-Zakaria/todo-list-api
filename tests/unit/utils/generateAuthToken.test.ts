import jwt from "jsonwebtoken";
import Config from "config";
import generateAuthToken from "./../../../utils/generateAuthToken";
import IUserWithVerification from "./../../../interfaces/IUserWithVerification";
import viewUser from "../../../utils/viewUser";
import { jest } from "@jest/globals";

const user: IUserWithVerification = {
  id: 1,
  name: "a",
  email: "a",
  password: "",
  emailVerification: {
    id: 1,
    isVerified: true,
    expiresAt: new Date(),
    code: "",
    userId: 1,
  },
};
jest.mock("../../../utils/viewUser", () => ({
  __esModule: true,
  default: () => ({
    id: 1,
    name: "a",
    email: "a",
    emailVerification: {
      isVerified: true,
    },
  }),
}));
(jwt.sign as jest.Mock) = jest.fn().mockReturnValue("a");

describe("generateAuthToken", () => {
  it("JWT sign should be called", () => {
    generateAuthToken(user);

    expect(jwt.sign).toHaveBeenCalledWith(
      viewUser(user),
      Config.get("jwtPrivateKey"),
      {
        expiresIn: Config.get("accessTokenTtl"),
      }
    );
  });

  it("Should return the access token", () => {
    const accessToken = generateAuthToken(user);

    expect(accessToken).toBe("a");
  });
});
