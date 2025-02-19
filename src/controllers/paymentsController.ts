import { Connection } from "promise-mysql";
import { Response } from "express";
import Controller from "../utilities/Controller";
import { ReqWithId } from "../types/misc";
import ErrorResponse from "../utilities/ErrorResponse";
import UserModel from "../models/userModel";
import PaymentModel from "../models/paymentModel";
import Stripe from "stripe";

export default class PaymentsController extends Controller {
  userModel: UserModel;
  paymentModel: PaymentModel;

  constructor(db: Connection) {
    super(db);
    this.userModel = new UserModel(this.db);
    this.paymentModel = new PaymentModel(this.db);

    this.createPaymentIntent = this.createPaymentIntent.bind(this);
    this.validatePayment = this.validatePayment.bind(this);
  }
  async createPaymentIntent(req: ReqWithId, res: Response) {
    const amount = parseInt(req.body.amount);
    const stripeSecret = process.env.STRIPE_PRIV_KEY;
    if (typeof stripeSecret !== "string") {
      throw new Error("STRIPE_PRIV_KEY is not defined in env");
    }
    if (!req.id) {
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }

    const stripe = new Stripe(stripeSecret);
    try {
      if (!(amount === 30 || amount === 100)) {
        res.status(400).json({ message: "Invalid payment amount" });
        return;
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
      });

      // register payment
      await this.paymentModel.create({
        user_id: req.id,
        stripe_pi: paymentIntent.id,
        amount: amount,
      });
      res.status(201).json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (e) {
      PaymentsController.handleError(e, res);
    }
  }
  async validatePayment(req: ReqWithId, res: Response) {
    const stripeSecret = process.env.STRIPE_PRIV_KEY;
    if (typeof stripeSecret !== "string") {
      throw new Error("STRIPE_PRIV_KEY is not defined in env");
    }
    if (!req.id) {
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }
    const pi = req.body.payment_intent;

    try {
      const stripe = new Stripe(stripeSecret);
      const paymentIntent = await stripe.paymentIntents.retrieve(pi);
      if (paymentIntent.status !== "succeeded") {
        throw new ErrorResponse("Payment intent not succeeded yet", 400);
      }
      await this.paymentModel.setValidByPi(pi);

      res.status(200).send();
    } catch (e) {
      PaymentsController.handleError(e, res);
    }
  }
}
