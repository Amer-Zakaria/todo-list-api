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
import request from "supertest";
import app from "../../../src";
import generateToken from "../../../src/utils/generateToken";
import prisma from "../../../src/client";
import Config from "config";
import { Server } from "http";

describe("Auth middleware", () => {
  let token: string;
  let refreshToken: string;
  let user: any;
  let server: Server;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        name: "Amer z",
        email: "authz@gmail.com",
        password: "AAaa11!",
        emailVerification: { create: {} },
      },
      include: { emailVerification: true },
    });

    server = app.listen(Config.get("port"));
  });

  afterAll(async () => {
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();
    server.close();
  });

  beforeEach(async () => {
    token = await generateToken(user);
    refreshToken = await generateToken(user, true);
  });

  afterEach(async () => {
    await prisma.refreshToken.deleteMany();
  });

  const exec = () =>
    request(app)
      .get("/api/todos")
      .set({ "x-auth-token": token, "x-refresh-token": refreshToken });

  it("Should return 401 if no tokens is provided", async () => {
    token = "";
    refreshToken = "";

    const res = await exec();

    expect(res.status).toBe(401);
  });

  it("Should return 403 if token is not provided and refreshToken is invalid", async () => {
    token = "";
    await prisma.refreshToken.deleteMany();

    const res = await exec();

    expect(res.status).toBe(403);
  });

  it("Should return 400 if the token is expired", async () => {
    const mockConfigGet = jest.spyOn(Config, "get");
    mockConfigGet.mockReturnValueOnce("SecretKey"); // jwtPrivateKey
    mockConfigGet.mockReturnValueOnce(0); // accessTokenTtl
    token = await generateToken(user);

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("Should return 200 if token is not provided and there's valid refresh token", async () => {
    token = "";

    const res = await exec();

    expect(res.status).toBe(200);
  });

  it("Should return the new access token if token is not provided and there's valid refresh token", async () => {
    token = "";

    const res = await exec();

    expect(res.headers["x-auth-token"]).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });

  it("Should return 200 if token is valid regardless of the refresh token", async () => {
    refreshToken = "";

    const res = await exec();

    expect(res.status).toBe(200);
  });
});
