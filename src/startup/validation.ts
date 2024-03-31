import Config from "config";
import { logger } from "../index";

export default () => {
  //Evnrionment variables validations
  if (!Config.has("jwtPrivateKey")) {
    logger.error("FATAL ERROR: jwtPrivateKey is not defined.");
    process.exit(1);
  }
  if (!Config.has("google.clientId") || !Config.has("google.clientSecret")) {
    logger.error(
      "FATAL ERROR: Google clientId or clientSecret is not defined."
    );
    process.exit(1);
  }
  if (!Config.has("mailer.emailPass")) {
    logger.error("FATAL ERROR: Email password for mailer is not defined.");
    process.exit(1);
  }
  if (!Config.has("db.uri")) {
    logger.error("FATAL ERROR: Database URI is not defined.");
    process.exit(1);
  }
};
