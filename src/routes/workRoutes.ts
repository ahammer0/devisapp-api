import express,{ Express } from "express";
import { Connection } from "promise-mysql";
import WorkController from "../controllers/workController";
import requireAuth from "../middlewares/requireAuth";

const workRoutes = (app: Express, db: Connection) => {
  const controller = new WorkController(db);

  const router = express.Router();
  router.post("/add", requireAuth, controller.createWork);
  router.get("/all", requireAuth, controller.getAllWorks);
  router.get("/:id", requireAuth, controller.getWorkById);
  router.put("/:id", requireAuth, controller.editWorkById);
  router.delete("/:id", requireAuth, controller.deleteWorkById);

  app.use("/works",requireAuth, router);

};
export default workRoutes;
