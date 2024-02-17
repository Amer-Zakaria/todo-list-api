import OriginalJoi from "joi";
import Config from "config";
import { logger } from "..";

module.exports = () => {
  if (!Config.get("jwtPrivateKey")) {
    logger.error("FATAL ERROR: jwtPrivateKey is not defined.");
    process.exit(1);
  }
};
