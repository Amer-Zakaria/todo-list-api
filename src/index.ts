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
import keepTheServerAlive from "./cron";
import cron from "node-cron";

const app = express();

//Startups
export const logger = makeLogger();
makeValidation();
makeMiddlewares(app);
makeRoutes(app);
export const transporter = makeMailer();
logger.info(`App Name: ${Config.get("name")}`);
if (process.env.NODE_ENV === "production")
  cron.schedule(Config.get("hitTheServerEvery"), () => {
    keepTheServerAlive();
  });

//Publishing
const port = Config.get("port");
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () =>
    logger.info(
      `\nOk, we start listing at port ${port}, any incoming requests?!`
    )
  );
}

export default app;
