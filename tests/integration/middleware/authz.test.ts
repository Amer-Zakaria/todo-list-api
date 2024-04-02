import { jest } from "@jest/globals";
import request from "supertest";
import app from "../../../src";
import generateToken from "../../../src/utils/generateToken";
import prisma from "../../../src/client";
import Config from "config";

describe("Auth middleware", () => {
  let token: string;
  let user: any;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        name: "Amer z",
        email: "authz@gmail.com",
        password: "AAaa11!",
        emailVerification: { create: { code: "a", expiresAt: new Date() } },
      },
      include: { emailVerification: true },
    });
  });

  afterAll(async () => {
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    token = await generateToken(user);
  });

  const exec = () => request(app).get("/api/todos").set("x-auth-token", token);

  it("Should return 401 if no token is provided", async () => {
    token = "";

    const res = await exec();

    expect(res.status).toBe(401);
  });

  it("Should return 400 if token is invalid", async () => {
    token = "a";

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("Should return 400 if the token is expired", async () => {
    const mockConfigGet = jest.spyOn(Config, "get");
    mockConfigGet.mockReturnValueOnce("SecretKey"); // jwtPrivateKey
    mockConfigGet.mockReturnValueOnce(0); // accessTokenTtl
    token = await generateToken(user);

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("Should return 201 if token is valid", async () => {
    const res = await exec();

    expect(res.status).toBe(200);
  });
});
