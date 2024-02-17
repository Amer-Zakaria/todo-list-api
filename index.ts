import "dotenv/config";
import express from "express";
import Config from "config";

const app = express();

//Startups
export const logger = require("./startup/logger")();
require("./startup/validation")();
require("./startup/middlewares")(app);
require("./startup/routes")(app);
export const transporter = require("./startup/mailer")();
export const isErrorWithStack: boolean = Config.get("stack");
logger.info(`App Name: ${Config.get("name")}`);

//Publishing
const port = Config.get("port");
app.listen(port, () =>
  logger.info(`\nOk, we start listing at port ${port}, any incoming requests?!`)
);
