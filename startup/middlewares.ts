import helmet from "helmet";
import express, { Express } from "express";
import cors from "cors";
import Config from "config";
import cookieParser from "cookie-parser";

module.exports = function (app: Express) {
  app.use(express.json());

  app.use(
    cors({
      origin: Config.get("origin"),
      credentials: true,
      preflightContinue: true,
      methods: ["GET", "PUT", "POST", "PATCH", "DELETE"],
    })
  );

  app.use(helmet());

  app.use(cookieParser());
};
