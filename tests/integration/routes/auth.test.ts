import request from "supertest";
import app from "../../../src/index";
import prisma from "../../../src/client";
import { transporter } from "../../../src/index";
import { jest } from "@jest/globals";
import bcrypt from "bcrypt";
import generateToken from "../../../src/utils/generateToken";
import IUserWithVerification from "../../../src/interfaces/IUserWithVerification";

describe("/api/auth", () => {
  const user = {
    name: "Amer Zakaria",
    email: "auth@gmail.com",
    password: "AAaa11!",
  };
  let createdUser: IUserWithVerification;

  beforeAll(async () => {
    (transporter.sendMail as jest.Mock) = jest.fn();

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    createdUser = (await prisma.user.create({
      include: { emailVerification: true },
      data: {
        ...user,
        password: hashedPassword,
        emailVerification: {
          create: { isVerified: true },
        },
      },
    })) as IUserWithVerification;
  });

  afterAll(async () => {
    await prisma.emailVerification.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("POST /", () => {
    let email: string;
    let password: string;

    const exec = async () => {
      return await request(app).post("/api/auth").send({ email, password });
    };

    beforeEach(() => {
      email = user.email;
      password = user.password;
    });

    afterEach(async () => {
      await prisma.refreshToken.deleteMany();
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
    it("Should return 400 if the email doesn't exist", async () => {
      email = "x@gmail.com";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the password doesn't contain at least 1 special characters", async () => {
      password = "AAaa11";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the password doesn't contain at least 2 lowercase characters", async () => {
      password = "AAa11@";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the password doesn't contain at least 2 uppercase characters", async () => {
      password = "Aaa11@";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the password doesn't contain at least 2 numerical characters", async () => {
      password = "AAaa1@";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the password does contain white space", async () => {
      password = "AAaa11 @";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 400 if the password is incorrect", async () => {
      password = user.password + "xxx";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return the access token in both the body and the header if the request body is valid", async () => {
      const res = await exec();
      expect(res.body).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      expect(res.headers["x-auth-token"]).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    });
    it("Should return refresh token in the header", async () => {
      const res = await exec();
      expect(res.headers["x-refresh-token"]).toMatch(
        /^[\w-]+\.[\w-]+\.[\w-]+$/
      );
    });
    it("Should save the refresh token in the database", async () => {
      const res = await exec();
      const refreshTokenObject = await prisma.refreshToken.findUnique({
        where: { token: res.headers["x-refresh-token"] },
      });
      expect(refreshTokenObject).not.toBeNull();
    });
  });

  describe("POST /token", () => {
    let validRefreshToken: string;
    let testRefreshToken: string;

    const exec = async () => {
      return await request(app)
        .post("/api/auth/token")
        .send({ refreshToken: testRefreshToken });
    };

    beforeAll(async () => {
      validRefreshToken = await generateToken(
        <IUserWithVerification>createdUser,
        true
      );
    });

    afterAll(async () => {
      await prisma.refreshToken.deleteMany();
    });

    beforeEach(async () => {
      testRefreshToken = validRefreshToken;
    });

    it("Should return 401 if the refreshToken is null", async () => {
      (testRefreshToken as any) = null;
      const res = await exec();
      expect(res.status).toBe(401);
    });
    it("Should return 400 if the refreshToken isn't a string", async () => {
      (testRefreshToken as any) = 1;
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should return 403 if the refreshToken doesn't exist in the database", async () => {
      testRefreshToken = "xXx.xXx.xXx";
      const res = await exec();
      expect(res.status).toBe(403);
    });
    it("Should return the accessToken both in the header and body if the refreshToken is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
      expect(res.headers["x-auth-token"]).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    });
  });

  describe("DELETE /logout", () => {
    let validRefreshToken: string;
    let testRefreshToken: string;

    const exec = async () => {
      return await request(app)
        .delete("/api/auth/logout")
        .send({ refreshToken: testRefreshToken });
    };

    beforeAll(async () => {
      validRefreshToken = await generateToken(
        <IUserWithVerification>createdUser,
        true
      );
    });

    afterAll(async () => {
      await prisma.refreshToken.deleteMany();
    });

    beforeEach(async () => {
      testRefreshToken = validRefreshToken;
    });

    it("Should return 401 if the refreshToken is null", async () => {
      (testRefreshToken as any) = null;
      const res = await exec();
      expect(res.status).toBe(401);
    });
    it("Should return 400 if the refreshToken isn't a string", async () => {
      (testRefreshToken as any) = 1;
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should delete the refresh token if the refreshToken in the request is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(204);
      const refreshToken = await prisma.refreshToken.findUnique({
        where: { token: validRefreshToken },
      });
      expect(refreshToken).toBeNull();
    });
  });
});
