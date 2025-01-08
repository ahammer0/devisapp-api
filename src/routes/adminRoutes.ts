import express, { Express } from "express";
import { Connection } from "promise-mysql";
import requireAdmin from "../middlewares/requireAdmin";
import AdminController from "../controllers/adminController";

const adminRoutes = (app: Express, db: Connection) => {
  const controller = new AdminController(db);

  app.post("/admin/login", controller.login);

  const router = express.Router();
  router.get("/users/all", controller.getAllUsers);
  router.get("/users/:id", controller.getOneUser);
  router.put("/users/:id", controller.editUser);
  router.delete("/users/:id", controller.deleteUser);

  router.get("/payments/all", controller.getAllPayments);

  app.use("/admin", requireAdmin, router);
};
export default adminRoutes;
