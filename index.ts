import dotenv from "dotenv";
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import express from "express";
import Config from "config";

const app = express();

//Startups
export const logger = require("./startup/logger")();
require("./startup/validation")();
require("./startup/middlewares")(app);
require("./startup/routes")(app);
export const transporter = require("./startup/mailer")();
logger.info(`App Name: ${Config.get("name")}`);

//Publishing
const port = Config.get("port");
app.listen(port, () =>
  logger.info(`\nOk, we start listing at port ${port}, any incoming requests?!`)
);
