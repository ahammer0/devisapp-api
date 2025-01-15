import express, { Express } from "express";
import { Connection } from "promise-mysql";
import QuotesController from "../controllers/quotesController";
import requireAuth from "../middlewares/requireAuth";

const quotesRoutes = (app: Express, db: Connection) => {
  const controller = new QuotesController(db);

  const router = express.Router();
  router.post("/add", controller.addQuote);
  router.get("/all", controller.getAllQuotes);
  router.get("/downloadQuotePdf/:id", controller.getQuotePdf);
  router.get("/:id", controller.getOneQuote);
  router.put("/:id", controller.editQuote);
  router.delete("/:id", controller.deleteQuote);

  app.use("/quotes", requireAuth, router);
};
export default quotesRoutes;
