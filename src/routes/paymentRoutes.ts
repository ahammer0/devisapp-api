import { Express, Router } from "express";
import { Connection } from "promise-mysql";
import PaymentsController from "../controllers/paymentsController";
import requireAuth from "../middlewares/requireAuth";

const paymentRoutes = (app: Express, db: Connection) => {
  const controller = new PaymentsController(db);

  const router = Router();
  router.post("/create-intent", requireAuth, controller.createPaymentIntent);
  router.post("/validate", requireAuth, controller.validatePayment);
  // TODO add webhook for stripe

  app.use("/payments", requireAuth, router);
};
export default paymentRoutes;
