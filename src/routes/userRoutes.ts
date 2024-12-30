import { Express } from "express";
import { Connection } from "promise-mysql";
import UserController from "../controllers/userController";
import requireAuth from "../middlewares/requireAuth";

const userRoutes = (app: Express, db: Connection) => {
  const controller = new UserController(db);

  app.post("/login", controller.login);
  app.post("/register", controller.register);
  app.get("/checkToken", controller.checkToken);
  app.put("/user", requireAuth, controller.updateUser);
};
export default userRoutes;
