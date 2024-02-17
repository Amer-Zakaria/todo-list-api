import { Express } from "express";
import error from "../middleware/error";
import todos from "../routes/todos";
import users from "../routes/users";
import auth from "../routes/auth";
import Config from "config";

module.exports = function (app: Express) {
  app.get("/", (req, res) =>
    res.json(`hello from the home page of "${Config.get("name")}"`)
  );
  app.use("/api/todos", todos);
  app.use("/api/users", users);
  app.use("/api/auth", auth);

  app.use(error);
};
