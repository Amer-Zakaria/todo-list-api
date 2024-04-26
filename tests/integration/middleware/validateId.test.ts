import request from "supertest";
import app from "../../../src";
import generateToken from "../../../src/utils/generateToken";
import prisma from "../../../src/client";
import { TodoStatus } from "@prisma/client";
import {
  describe,
  expect,
  afterAll,
  beforeAll,
  beforeEach,
  it,
} from "@jest/globals";

describe("Validate id middleware", () => {
  let token: string;
  let user: any;
  let validTodoId: number;
  let testTodoId: any;

  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        name: "Amer z",
        email: "validateId@gmail.com",
        password: "AAaa11!",
        emailVerification: { create: {} },
      },
      include: { emailVerification: true },
    });
    token = await generateToken(user);

    const todo = await prisma.todo.create({
      data: { details: "x", userId: user.id },
    });
    validTodoId = todo.id;
  });

  afterAll(async () => {
    await prisma.todo.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(() => {
    testTodoId = validTodoId;
  });

  const exec = () =>
    request(app)
      .patch(`/api/todos/${Object.values(TodoStatus)[0]}/${testTodoId}`)
      .set("x-auth-token", token);

  it("Should return 400 if the id is not a number", async () => {
    testTodoId = "NaN";

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("Should return 400 if the id smaller than 0", async () => {
    testTodoId = -1;

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("Should return 400 if the id bigger than 99999999999999", async () => {
    testTodoId = 99999999999999 + 1;

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("Should return 404 if the there's no record for the provided id", async () => {
    testTodoId = validTodoId !== 1 ? 1 : 0;

    const res = await exec();

    expect(res.status).toBe(404);
  });

  it("Should return 200 if the id was totally valid", async () => {
    const res = await exec();

    expect(res.status).toBe(200);
  });
});
