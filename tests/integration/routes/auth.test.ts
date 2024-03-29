import request from "supertest";
import app from "../../../index";
import prisma from "../../../prisma/client";
import { transporter } from "../../../index";
import { jest } from "@jest/globals";

describe("/api/auth", () => {
  const user = {
    name: "Amer Zakaria",
    email: "a@gmail.com",
    password: "AAaa11!",
  };

  beforeAll(async () => {
    (transporter.sendMail as jest.Mock) = jest.fn();

    await request(app).post("/api/users").send(user);
  });

  afterAll(async () => {
    await prisma.emailVerification.deleteMany();
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
  });
});
