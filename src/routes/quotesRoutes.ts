import express, { Express } from "express";
import { Connection } from "promise-mysql";
import quotesController from "../controllers/quotesController";
import requireAuth from "../middlewares/requireAuth";

const quotesRoutes = (app: Express, db: Connection) => {
  const controller = new quotesController(db);

  const router = express.Router();
  router.post("/add", controller.addQuote);
  router.get("/all", controller.getAllQuotes);
  router.get("/:id", controller.getOneQuote);
  router.put("/:id", controller.editQuote);
  router.delete("/:id", controller.deleteQuote);

  app.use("/quotes", requireAuth, router);
};
export default quotesRoutes;
