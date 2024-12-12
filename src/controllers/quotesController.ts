import { paymentCreate } from "../types/payments";
import { userCreate } from "../types/users";
import PaymentModel from "../models/paymentModel";
import UserModel from "../models/userModel";
import { Connection } from "promise-mysql";
import { Request, Response } from "express";

export default class quotesController {
  db: Connection;

  constructor(db: Connection) {
    this.db = db;

    this.testController = this.testController.bind(this);
  }
  async testController(req: Request, res: Response) {
    const paymentModel = new PaymentModel(this.db);

    const data: paymentCreate = {
      user_id: 1,
      amount: 100,
    };

    try {
      const dbRes = await paymentModel.getAll()
      console.log(dbRes);
    } catch (e) {
      console.log("erreur", e);
    }

    res.send("test");
  }
}
