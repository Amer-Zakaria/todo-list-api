import Config from "config";
import { logger } from "..";

module.exports = () => {
  //Evnrionment variables validations
  if (!Config.get("jwtPrivateKey")) {
    logger.error("FATAL ERROR: jwtPrivateKey is not defined.");
    process.exit(1);
  }
  if (!Config.get("google.clientId") || !Config.get("google.clientSecret")) {
    logger.error(
      "FATAL ERROR: Google clientId or clientSecret is not defined."
    );
    process.exit(1);
  }
  if (!Config.get("mailer.emailPass")) {
    logger.error("FATAL ERROR: Email password for mailer is not defined.");
    process.exit(1);
  }
  if (!Config.get("db.uri")) {
    logger.error("FATAL ERROR: Database URI is not defined.");
    process.exit(1);
  }
};
