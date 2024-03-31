import devLogger from "./dev-logger";
import proLogger from "./prod-logger";
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
