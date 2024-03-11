import helmet from "helmet";
import express, { Express } from "express";
import cors from "cors";
import Config from "config";
import cookieParser from "cookie-parser";

module.exports = function (app: Express) {
  app.use(express.json());

  app.use(
    cors({
      origin: (<string>Config.get("origin")).replace("/Todo-List", "") || "",
      credentials: true,
      preflightContinue: true,
      methods: ["GET", "PUT", "POST", "PATCH", "DELETE"],
    })
  );

  app.use(helmet());

  app.use(cookieParser());
};
