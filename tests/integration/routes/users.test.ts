import request from "supertest";
import app from "../../../src/index";
import prisma from "../../../src/client";
import { transporter } from "../../../src/index";
import { jest } from "@jest/globals";
import bcrypt from "bcrypt";

describe("/api/users", () => {
  beforeAll(() => {
    (transporter.sendMail as jest.Mock) = jest
      .fn()
      .mockImplementation(() => Promise.resolve());
  });

  afterEach(async () => {
    await prisma.emailVerification.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

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
      password = "AAaa12!";
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
    it("Should save the user if the request body is valid", async () => {
      await exec();
      const user = await prisma.user.findFirst({ where: { name: "John Doe" } });
      expect(user).not.toBeNull();
    });
    it("Should hash the password if the request body is valid", async () => {
      const res = await exec();
      const user = await prisma.user.findUnique({ where: { id: res.body.id } });
      const isValidePassword = await bcrypt.compare(
        password,
        <string>user?.password
      );
      expect(isValidePassword).toBe(true);
    });
    it("Should return the user alongside the access/refresh token in the header if the request body is valid", async () => {
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
  });
});
