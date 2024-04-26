import request from "supertest";
import app, { transporter } from "../../../src/index";
import prisma from "../../../src/client";
import bcrypt from "bcrypt";
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
import Config from "config";
import IUserWithVerification from "../../../src/interfaces/IUserWithVerification";
import generateToken from "../../../src/utils/generateToken";
import jwt from "jsonwebtoken";

describe("/api/users", () => {
  (transporter.sendMail as jest.Mock) = jest
    .fn()
    .mockImplementation(() => Promise.resolve());

  describe("POST /", () => {
    let name: string;
    let email: string;
    let password: string;

    const exec = async () => {
      return await request(app)
        .post("/api/users")
        .send({ name, email, password });
    };

    beforeEach(() => {
      name = "John Doe";
      email = "a@gmail.com";
      password = "aaaa1111";
    });

    afterEach(async () => {
      await prisma.refreshToken.deleteMany();
      await prisma.emailVerification.deleteMany();
      await prisma.user.deleteMany();
    });

    it("Should return 400 if the name is less than 5 characters", async () => {
      name = "aa a";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the name is more than 255 characters", async () => {
      name = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the email is less than 5 characters", async () => {
      email = `@x.x`;
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the email is more than 255 characters", async () => {
      email = `${new Array(257).join("a")}@gmail.com`;
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the email isn't valid email", async () => {
      email = "a@@gmail.com";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the should return 400 if the email is already exist", async () => {
      await exec();
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should save the user if the request is valid", async () => {
      await exec();
      const user = await prisma.user.findFirst({ where: { name: "John Doe" } });
      expect(user).not.toBeNull();
    });
    it("Should hash the password if the request is valid", async () => {
      const res = await exec();
      const user = await prisma.user.findUnique({ where: { id: res.body.id } });
      const isValidePassword = await bcrypt.compare(
        password,
        <string>user?.password
      );
      expect(isValidePassword).toBe(true);
    });
    it("Should return the user alongside the access/refresh token in the header if the request is valid", async () => {
      const res = await exec();
      expect(res.body).toMatchObject({
        name: "John Doe",
        email: "a@gmail.com",
      });
      expect(res.headers["x-auth-token"]).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      expect(res.headers["x-refresh-token"]).toMatch(
        /^[\w-]+\.[\w-]+\.[\w-]+$/
      );
    });
    it("Should send an email verification link if request is valid", async () => {
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

  describe("POST /regenerate-link", () => {
    let token: string;
    let createdUser: IUserWithVerification;

    beforeAll(async () => {
      const result = (await prisma.user.create({
        include: { emailVerification: true },
        data: {
          name: "xyzxyz",
          email: "xyzxyz@gmail.com",
          password: "aaaa1111",
          emailVerification: {
            create: { isVerified: false },
          },
        },
      })) as IUserWithVerification;

      createdUser = result;
      token = await generateToken(result);
    });

    afterAll(async () => {
      await prisma.emailVerification.deleteMany();
      await prisma.user.deleteMany();
    });

    const exec = () =>
      request(app)
        .post("/api/users/regenerate-link")
        .set("x-auth-token", token);

    it("Should return 400 if the email is already verified", async () => {
      await prisma.emailVerification.update({
        where: { id: createdUser.emailVerification.id },
        data: { isVerified: true },
      });

      const res = await exec();
      expect(res.status).toBe(400);

      await prisma.emailVerification.update({
        where: { id: createdUser.emailVerification.id },
        data: { isVerified: false },
      });
    });
    it("Should send an email verification link if request is valid", async () => {
      await exec();
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: Config.get("mailer.email"),
          to: createdUser.email,
          html: expect.stringMatching(/[\w-]+\.[\w-]+\.[\w-]+/),
        })
      );
    });
    it("Should return 200 if the request is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });
  });

  describe("GET /verify-email", () => {
    let emailVerificationToken: string;
    let createdUser: IUserWithVerification;

    beforeAll(async () => {
      const result = (await prisma.user.create({
        include: { emailVerification: true },
        data: {
          name: "xyzxyz",
          email: "xyzxyz@gmail.com",
          password: "aaaa1111",
          emailVerification: {
            create: { isVerified: false },
          },
        },
      })) as IUserWithVerification;

      createdUser = result;
    });

    beforeEach(() => {
      emailVerificationToken = jwt.sign(
        { userId: createdUser.id },
        Config.get("emailVerification.jwtPrivateKey") as string,
        { expiresIn: "10m" }
      );
    });

    afterEach(async () => {
      await prisma.emailVerification.update({
        where: { id: createdUser.emailVerification.id },
        data: { isVerified: false },
      });

      await prisma.refreshToken.deleteMany();
    });

    afterAll(async () => {
      await prisma.refreshToken.deleteMany();
      await prisma.emailVerification.deleteMany();
      await prisma.user.deleteMany();
    });

    const exec = () =>
      request(app).get(
        `/api/users/verify-email?emailVerificationToken=${emailVerificationToken}`
      );

    it("Should redirect to the error page if the provided token isn't a valid string", async () => {
      emailVerificationToken = "";
      const res = await exec();
      expect(res.status).toBe(302);
      expect(res.header["location"]).toMatch(
        Config.get("emailVerification.errorPathName")
      );
      expect(res.header["location"]).toMatch("message=");
    });
    it("Should redirect to the error page if the provided token is not valid", async () => {
      emailVerificationToken = emailVerificationToken = jwt.sign(
        { userId: createdUser.id },
        "xyz",
        { expiresIn: "10m" }
      );
      const res = await exec();
      expect(res.status).toBe(302);
      expect(res.header["location"]).toMatch(
        Config.get("emailVerification.errorPathName")
      );
      expect(res.header["location"]).toMatch("message=");
    });
    it("Should redirect to the error page if user is already verified", async () => {
      await prisma.emailVerification.update({
        where: { id: createdUser.emailVerification.id },
        data: { isVerified: true },
      });
      const res = await exec();
      expect(res.status).toBe(302);
      expect(res.header["location"]).toMatch(
        Config.get("emailVerification.errorPathName")
      );
      expect(res.header["location"]).toMatch("message=");
    });
    it("Should verify the user if request is fully valid", async () => {
      await exec();
      const emailVerification = await prisma.emailVerification.findUnique({
        where: { id: createdUser.emailVerification.id },
      });
      expect(emailVerification?.isVerified).toEqual(true);
    });
    it("Should redirect to the homepage with a new refresh and access tokens if the request is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(302);
      expect(res.header["location"]).not.toMatch(
        Config.get("emailVerification.errorPathName")
      );
      const urlParams = new URLSearchParams(
        res.header["location"].split("?")[1]
      );
      expect(urlParams.has("message")).toBeFalsy();
      expect(urlParams.get("accessToken")).toMatch(/[\w-]+\.[\w-]+\.[\w-]+/);
      expect(urlParams.get("refreshToken")).toMatch(/[\w-]+\.[\w-]+\.[\w-]+/);
    });
  });
});
