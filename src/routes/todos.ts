import express, { NextFunction, Request, Response } from "express";
import Joi from "joi";
import prisma from "../client";
import validateReq from "../middleware/validateReq";
import validateId from "../middleware/validateId";
import validateTodo from "./../schemas/todo";
import { TodoStatus } from "@prisma/client";
import extractErrorMessagesJOI from "../utils/extractErrorMessagesJOI";
import authz from "../middleware/authz";
import owner from "../middleware/owner";
import constructErrorResponse from "../utils/constructErrorResponse";
import todoUpdatedEmitter from "../utils/todoUpdatedEmitter";

const router = express.Router();

router.get("/", authz, async (req, res) => {
  const todos = await prisma.todo.findMany({
    where: { userId: res.locals.user.id },
    select: {
      id: true,
      details: true,
      status: true,
      addedAt: true,
    },
  });

  res.json(todos);
});

router.post(
  "/",
  authz,
  validateReq(validateTodo, "body"),
  async (req, res, next) => {
    const todo = await prisma.todo.create({
      data: { userId: res.locals.user.id, ...req.body },
    });

    res.status(201).json(todo);
    todoUpdatedEmitter({
      userId: res.locals.user.id,
      socketId: req.headers["socket-id"],
    });
  }
);

router.patch(
  "/:id",
  [authz, validateId(prisma.todo), owner, validateReq(validateTodo, "body")],
  async (req: Request, res: Response) => {
    const todo = await prisma.todo.update({
      where: { id: +req.params.id },
      data: req.body,
    });

    res.status(200).json(todo);
    todoUpdatedEmitter({
      userId: res.locals.user.id,
      socketId: req.headers["socket-id"],
    });
  }
);

router.patch(
  "/:status/:id",
  [authz, validateId(prisma.todo), owner],
  async (req: Request, res: Response) => {
    const todoStatus = Object.values(TodoStatus);
    const todoStatusSchema = Joi.string()
      .required()
      .valid(...todoStatus);
    const validationResult = todoStatusSchema.validate(req.params.status);
    if (validationResult.error) {
      return res.status(400).json(
        constructErrorResponse(new Error(), {
          validation: extractErrorMessagesJOI(validationResult.error),
        })
      );
    }

    const todo = await prisma.todo.update({
      where: { id: +req.params.id },
      data: {
        status: <TodoStatus>req.params.status,
      },
    });

    res.status(200).json(todo);
    todoUpdatedEmitter({
      userId: res.locals.user.id,
      socketId: req.headers["socket-id"],
    });
  }
);

router.delete(
  "/:id",
  [authz, validateId(prisma.todo), owner],
  async (req: Request, res: Response) => {
    const todo = await prisma.todo.delete({
      where: { id: +req.params.id },
    });

    res.status(200).json(todo);
    todoUpdatedEmitter({
      userId: res.locals.user.id,
      socketId: req.headers["socket-id"],
    });
  }
);

export default router;
