import request from "supertest";
import app from "../../..";
import generateAuthToken from "../../../utils/generateAuthToken";
import prisma from "../../../prisma/client";
import IUserWithVerification from "../../../interfaces/IUserWithVerification";

describe("Auth middleware", () => {
  let user: any;
  let token: string;
  let todoId: number;

  beforeAll(async () => {
    const result = await prisma.user.create({
      data: {
        name: "Amer1",
        email: "owner1@gmail.com",
        password: "AAaa11!",
        emailVerification: { create: { code: "a", expiresAt: new Date() } },
      },
      include: { emailVerification: true },
    });
    user = result;

    const todo = await prisma.todo.create({
      data: { details: "x", userId: result.id },
    });
    todoId = todo.id;
  });

  afterAll(async () => {
    await prisma.todo.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(() => {
    token = generateAuthToken(user);
  });

  const exec = () =>
    request(app)
      .patch(`/api/todos/${todoId}`)
      .set("x-auth-token", token)
      .send({ details: "xx" });

  it("Should return 403 if the user is not the owner of the record", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Amer2",
        email: "owner2@gmail.com",
        password: "AAaa11!",
        emailVerification: { create: { code: "a", expiresAt: new Date() } },
      },
      include: { emailVerification: true },
    });
    token = generateAuthToken(<IUserWithVerification>user);

    const res = await exec();

    expect(res.status).toBe(403);
  });

  it("Should return 200 if the user is the owner", async () => {
    const res = await exec();

    expect(res.status).toBe(200);
  });
});