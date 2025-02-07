import express, { Express } from "express";
import { Connection } from "promise-mysql";
import TicketsController from "../controllers/ticketsController";
import requireAuth from "../middlewares/requireAuth";

const ticketsRoutes = (app: Express, db: Connection) => {
  const controller = new TicketsController(db);

  const router = express.Router();
  router.get("/all", requireAuth, controller.getAllTicketsByUserId);
  router.get("/:id", requireAuth, controller.getOneTicketByUserId);
  router.post("/", requireAuth, controller.createTicket);

  app.use("/tickets", requireAuth, router);
};
export default ticketsRoutes;
