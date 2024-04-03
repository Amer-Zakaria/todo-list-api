import request from "supertest";
import app from "../../../src/index";
import prisma from "../../../src/client";
import { Todo, TodoStatus } from "@prisma/client";
import generateToken from "../../../src/utils/generateToken";
import IUserWithVerification from "../../../src/interfaces/IUserWithVerification";

describe("/api/todos", () => {
  const headers = { ["x-auth-token"]: "" };
  let userId: number;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: "Amer z",
        email: "authz@gmail.com",
        password: "AAaa11!",
        emailVerification: { create: {} },
      },
      include: { emailVerification: true },
    });

    headers["x-auth-token"] = await generateToken(<IUserWithVerification>user);
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.todo.deleteMany();
  });

  afterAll(async () => {
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("GET /", () => {
    beforeEach(async () => {
      const todos = [
        { details: "todo1", userId },
        { details: "todo2", userId },
      ];
      await prisma.todo.createMany({ data: todos });
    });

    it("Should return all the todos", async () => {
      const res = await request(app).get("/api/todos").set(headers);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(
        (<[Todo]>res.body).some((p) => p.details === "todo1")
      ).toBeTruthy();
      expect(
        (<[Todo]>res.body).some((p) => p.details === "todo2")
      ).toBeTruthy();
    });

    it("The todo should contain the expected data", async () => {
      const res = await request(app).get("/api/todos").set(headers);

      expect(res.body[0]).toMatchObject({
        id: expect.any(Number),
        details: "todo1",
        status: "ONGOING",
        addedAt: expect.any(String),
      });
    });
  });

  describe("POST /", () => {
    let details: string;

    const exec = async () => {
      return await request(app)
        .post("/api/todos")
        .set(headers)
        .send({ details });
    };

    beforeEach(() => {
      details = "t";
    });

    it("Should return 400 if details is not present", async () => {
      (details as any) = undefined;
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should save the todo if the request body is valid", async () => {
      await exec();
      const todo = await prisma.todo.findFirst({ where: { details } });
      expect(todo).not.toBeNull();
    });
    it("Should return the expected todo if the request body is valid", async () => {
      const res = await exec();
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        addedAt: expect.any(String),
        details,
        status: "ONGOING",
        userId: expect.any(Number),
      });
    });
  });

  describe("PATCH /:id", () => {
    let todoId: number;
    let newDetails: string;

    const exec = async () => {
      return await request(app)
        .patch(`/api/todos/${todoId}`)
        .set(headers)
        .send({ details: newDetails });
    };

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/todos`)
        .set(headers)
        .send({ details: "t" });
      todoId = res.body.id;

      newDetails = "new t";
    });

    it("Should return 400 if details is not present", async () => {
      (newDetails as any) = undefined;
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("Should save the updated todo if the request body is valid", async () => {
      await exec();
      const todo = await prisma.todo.findFirst({
        where: { details: newDetails },
      });
      expect(todo).not.toBeNull();
    });
    it("Should return the expected todo if the request body is valid", async () => {
      const res = await exec();
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        addedAt: expect.any(String),
        details: newDetails,
        status: "ONGOING",
        userId: expect.any(Number),
      });
    });
  });

  describe("PATCH /:status/:id", () => {
    let todoId: number;
    let status: string;

    const exec = async () => {
      return await request(app)
        .patch(`/api/todos/${status}/${todoId}`)
        .set(headers);
    };

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/todos`)
        .set(headers)
        .send({ details: "t" });
      todoId = res.body.id;

      status = "new t";
    });

    it("Should return 400 if details isn't valid", async () => {
      status = "XXX";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it.each(Object.values(TodoStatus))(
      'Should save the todo if the status is "%i"',
      async (currentStatus) => {
        status = currentStatus;
        const res = await exec();
        expect(res.status).toBe(200);
        const updatedTodo = await prisma.todo.findUnique({
          where: { id: todoId },
        });
        expect(updatedTodo?.status).toBe(currentStatus);
      }
    );
  });

  describe("DELETE /:id", () => {
    let todoId: number;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/todos`)
        .set(headers)
        .send({ details: "t" });
      todoId = res.body.id;
    });

    const exec = async () => {
      return await request(app).delete(`/api/todos/${todoId}`).set(headers);
    };

    it("Should delete the todo", async () => {
      await exec();
      const todo = await prisma.todo.findUnique({ where: { id: todoId } });
      expect(todo).toBeNull();
    });
  });
});
