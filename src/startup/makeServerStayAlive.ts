import Config from "config";
import keepTheServerAlive from "./../cron";
import cron from "node-cron";

export default function makeServerStayAlive() {
  if (process.env.NODE_ENV === "production")
    cron.schedule(Config.get("hitTheServerEvery"), () => {
      keepTheServerAlive();
    });
}
