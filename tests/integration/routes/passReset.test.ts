import request from "supertest";
import app, { transporter } from "../../../src/index";
import IUserWithVerification from "../../../src/interfaces/IUserWithVerification";
import prisma from "../../../src/client";
import jwt from "jsonwebtoken";
import Config from "config";
import {
  jest,
  describe,
  expect,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  it,
} from "@jest/globals";
import bcrypt from "bcrypt";

describe("/api/reset-password", () => {
  describe("POST /request-password-reset", () => {
    (transporter.sendMail as jest.Mock) = jest
      .fn()
      .mockImplementation(() => Promise.resolve());

    let createdUser: IUserWithVerification;
    let email: string;

    beforeAll(async () => {
      createdUser = (await prisma.user.create({
        include: { emailVerification: true },
        data: {
          name: "a",
          email: "resetPass@gmail.com",
          password: "a",
          emailVerification: {
            create: { isVerified: true },
          },
        },
      })) as IUserWithVerification;
    });
    beforeEach(() => {
      email = "resetPass@gmail.com";
    });
    afterAll(async () => {
      await prisma.emailVerification.deleteMany();
      await prisma.user.deleteMany();
    });

    const exec = () =>
      request(app)
        .post("/api/reset-password/request-password-reset")
        .send({ email });

    it("Should return 400 for an invalid email", async () => {
      email = "resetPass@@gmail.com";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the user is found to be signed in with Google", async () => {
      await prisma.user.update({
        where: { id: createdUser.id },
        data: { password: null },
      });

      const res = await exec();
      expect(res.status).toBe(400);

      await prisma.user.update({
        where: { id: createdUser.id },
        data: { password: "Aa" },
      });
    });
    it("Should return 403 if the user didn't verify his email", async () => {
      await prisma.emailVerification.update({
        where: { id: createdUser.emailVerification.id },
        data: { isVerified: false },
      });

      const res = await exec();
      expect(res.status).toBe(403);

      await prisma.emailVerification.update({
        where: { id: createdUser.emailVerification.id },
        data: { isVerified: true },
      });
    });
    it("Should return 200 if the request is fully valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });
    it("Should send an email if the request is fully valid", async () => {
      await exec();
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: Config.get("mailer.email"),
          to: email,
          html: expect.stringMatching(/[\w-]+\.[\w-]+\.[\w-]+/),
        })
      );
    });
  });

  describe("PUT /", () => {
    let token: string;
    const validNewPassword = "xxxx2222";
    let newPassword: string;
    let createdUser: IUserWithVerification;

    beforeAll(async () => {
      createdUser = (await prisma.user.create({
        include: { emailVerification: true },
        data: {
          name: "a",
          email: "a@gmail.com",
          password: "a",
          emailVerification: {
            create: { isVerified: true },
          },
        },
      })) as IUserWithVerification;
    });
    beforeEach(() => {
      token = jwt.sign(
        { userId: createdUser.id },
        Config.get("resetPass.jwtPrivateKey") as string,
        { expiresIn: "1m" }
      );
      newPassword = validNewPassword;
    });
    afterEach(async () => {
      await prisma.refreshToken.deleteMany();
    });
    afterAll(async () => {
      await prisma.emailVerification.deleteMany();
      await prisma.user.deleteMany();
    });

    const exec = () =>
      request(app).put("/api/reset-password/").send({ token, newPassword });

    it("Should return 400 if the token structure is invalid", async () => {
      token = "Xx.xX";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the token is invalid", async () => {
      token = jwt.sign({ userId: createdUser.id }, "xyz", { expiresIn: "1m" });
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 200 if the request is fully valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });
    it("Should hash and reset the password if the request is fully valid", async () => {
      await exec();

      const user = await prisma.user.findUnique({
        where: { id: createdUser.id },
      });
      const newlyHashedPassword = user?.password as string;

      const isValidePassword = await bcrypt.compare(
        validNewPassword,
        newlyHashedPassword
      );
      expect(isValidePassword).toBe(true);
    });
    it("Should return the new access and refresh tokens if the request is fully valid", async () => {
      const res = await exec();

      expect(res.headers["x-auth-token"]).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      expect(res.headers["x-refresh-token"]).toMatch(
        /^[\w-]+\.[\w-]+\.[\w-]+$/
      );
    });
  });
});
