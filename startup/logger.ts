import "express-async-errors";
import devLogger from "../config/dev-logger";
import proLogger from "../config/prod-logger";
import { Logger } from "winston";

module.exports = function buildLogger() {
  let logger: Logger;
  if (process.env.NODE_ENV === "development") {
    logger = devLogger();
  } else {
    logger = devLogger();
  }

  return logger;
};
