import { Express } from "express";
import error from "../middleware/error";
import todos from "../routes/todos";
import users from "../routes/users";
import auth from "../routes/auth";
import resetPassword from "../routes/passwordReset";
import oauth from "../routes/oauth";
import Config from "config";

export default (app: Express) => {
  app.get("/", (req, res) =>
    res.json(`hello from the home page of "${Config.get("name")}"`)
  );
  app.use("/api/todos", todos);
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use("/api/reset-password", resetPassword);
  app.use("/api/oauth", oauth);

  app.use(error);
};
