import helmet from "helmet";
import express, { Express } from "express";
import cors from "cors";
import Config from "config";
import compression from "compression";

export default (app: Express) => {
  app.use(express.json());

  app.use(compression());

  app.use(
    cors({
      origin: Config.get("origin"),
      allowedHeaders: ["x-refresh-token", "x-auth-token", "Content-Type"],
      exposedHeaders: ["x-auth-token", "x-refresh-token"],
      preflightContinue: true,
      methods: ["GET", "PUT", "POST", "PATCH", "DELETE"],
    })
  );

  app.use(helmet());
};
