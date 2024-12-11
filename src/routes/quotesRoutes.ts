import express, { Express } from "express";
import { Connection } from "promise-mysql";
import quotesController from "../controllers/quotesController";

const quotesRoutes = (app: Express, db: Connection) => {
  const controller = new quotesController(db);

  app.get("/test", controller.testController);
};
export default quotesRoutes;
