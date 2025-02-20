import express from "express";
import "express-async-errors";
import dotenv from "dotenv";
dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});
import Config from "config";
import makeValidation from "./startup/validation";
import makeLogger from "./startup/logger";
import makeMiddlewares from "./startup/middlewares";
import makeRoutes from "./startup/routes";
import makeMailer from "./startup/mailer";
import makeServerStayAlive from "./startup/makeServerStayAlive";
import http from "http";
import makeSocket from "./startup/socket";

const app = express();
const server = http.createServer(app);

//Startups
export const io = makeSocket(server);
export const logger = makeLogger();
makeValidation();
makeMiddlewares(app);
makeRoutes(app);
export const transporter = makeMailer();
logger.info(`App Name: ${Config.get("name")}`);
// makeServerStayAlive();

//Publishing
const port = Config.get("port");
if (process.env.NODE_ENV !== "test") {
  server.listen(port, () =>
    logger.info(
      `\nOk, we start listing at port ${port}, any incoming requests?!`
    )
  );
}

export default app;
