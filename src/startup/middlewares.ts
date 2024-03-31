import helmet from "helmet";
import express, { Express } from "express";
import cors from "cors";
import Config from "config";

export default (app: Express) => {
  app.use(express.json());

  app.use(
    cors({
      origin: Config.get("origin"),
      allowedHeaders: ["x-auth-token", "Content-Type"],
      exposedHeaders: ["x-auth-token"],
      preflightContinue: true,
      methods: ["GET", "PUT", "POST", "PATCH", "DELETE"],
    })
  );

  app.use(helmet());
};
