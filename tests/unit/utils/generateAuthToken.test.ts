import jwt from "jsonwebtoken";
import Config from "config";
import generateToken from "./../../../src/utils/generateToken";
import IUserWithVerification from "./../../../src/interfaces/IUserWithVerification";
import viewUser from "../../../src/utils/viewUser";
import { jest } from "@jest/globals";
import prisma from "../../../src/client";

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
jest.mock("../../../src/utils/viewUser", () => ({
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

describe("generateToken", () => {
  (jwt.sign as jest.Mock) = jest.fn().mockReturnValue("a");
  (prisma.refreshToken.create as jest.Mock) = jest.fn();

  it("JWT sign should be called with access token configurations if isRefreshToken set to be falsy", async () => {
    await generateToken(user);

    expect(jwt.sign).toHaveBeenCalledWith(
      viewUser(user),
      Config.get("jwtPrivateKey"),
      {
        expiresIn: Config.get("accessTokenTtl"),
      }
    );
  });

  it("JWT sign should be called with refresh token configurations if isRefreshToken set to be true", async () => {
    await generateToken(user, true);

    expect(jwt.sign).toHaveBeenCalledWith(
      viewUser(user),
      Config.get("refreshJwtPrivateKey"),
      {}
    );
  });

  it("Should call create refreshToken if isRefreshToke is true", async () => {
    const token = await generateToken(user, true);

    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: { token, userId: user.id },
    });
  });

  it("Should return the access token", async () => {
    const accessToken = await generateToken(user);

    expect(accessToken).toBe("a");
  });
});
