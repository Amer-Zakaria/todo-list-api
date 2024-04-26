import {
  jest,
  describe,
  expect,
  afterEach,
  beforeEach,
  it,
} from "@jest/globals";
import app from "../../../src/index";
import request from "supertest";
import jwt from "jsonwebtoken";
import Config from "config";
import axios from "axios";
import prisma from "../../../src/client";

describe("/api/oauth", () => {
  describe("GET /google", () => {
    (axios.post as jest.Mock) = jest
      .fn()
      .mockResolvedValue({ data: { id_token: "xyz" } } as never);

    const prismaUserUpsertMock = jest.spyOn(prisma.user, "upsert");

    beforeEach(() => {
      (jwt.decode as jest.Mock) = jest.fn().mockImplementation(() => ({
        name: "a",
        email: "g@gmail.com",
        email_verified: true,
      }));
    });

    afterEach(async () => {
      await prisma.refreshToken.deleteMany();
    });

    const exec = () => request(app).get("/api/oauth/google");

    it("Should call getGoogleOAuthTokens", async () => {
      await exec();
      expect(jwt.decode).toHaveBeenCalledWith("xyz");
    });
    it("Should redirect to the error page if Google account isn't verified", async () => {
      (jwt.decode as jest.Mock) = jest.fn().mockImplementation(() => ({
        name: "a",
        email: "g@gmail.com",
        email_verified: false,
      }));
      const res = await exec();
      expect(res.status).toBe(302);
      expect(res.header["location"]).toMatch(
        Config.get("google.errorPathName")
      );
    });
    it("Should redirect to the error page on unexpected errors", async () => {
      prismaUserUpsertMock.mockRejectedValueOnce("s");

      const res = await exec();
      expect(res.status).toBe(302);
      expect(res.header["location"]).toMatch(
        Config.get("google.errorPathName")
      );
    });
    it("Should redirect to the origin if request is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(302);
      expect(res.header["location"]).not.toMatch(
        Config.get("google.errorPathName")
      );
    });
    it("Should send a new access and refresh tokens if request is valid", async () => {
      const res = await exec();
      const urlParams = new URLSearchParams(
        res.header["location"].split("?")[1]
      );
      expect(urlParams.has("message")).toBeFalsy();
      expect(urlParams.get("accessToken")).toMatch(/[\w-]+\.[\w-]+\.[\w-]+/);
      expect(urlParams.get("refreshToken")).toMatch(/[\w-]+\.[\w-]+\.[\w-]+/);
    });
  });
});
