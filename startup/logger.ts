import devLogger from "../config/dev-logger";
import proLogger from "../config/prod-logger";
import { Logger } from "winston";

export default () => {
  let logger: Logger;
  if (process.env.NODE_ENV === "development") {
    logger = devLogger();
  } else {
    logger = devLogger();
  }

  return logger;
};
