import helmet from "helmet";
import express, { Express } from "express";

module.exports = function (app: Express) {
  app.use(express.json());

  app.use(helmet());
};
