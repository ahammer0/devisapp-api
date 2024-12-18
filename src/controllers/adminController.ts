import { Response, Request } from "express";
import { Connection } from "promise-mysql";
import jwt from "jsonwebtoken";
import UserModel from "../models/userModel";
import PaymentModel from "../models/paymentModel";
import Controller from "../utilities/Controller";

export default class AdminController extends Controller {
  userModel: UserModel;
  paymentModel: PaymentModel;

  constructor(db: Connection) {
    super(db);

    this.userModel = new UserModel(this.db);
    this.paymentModel = new PaymentModel(this.db);

    this.login = this.login.bind(this);

    this.getAllUsers = this.getAllUsers.bind(this);
    this.getOneUser = this.getOneUser.bind(this);
    this.editUser = this.editUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);

    this.getAllPayments = this.getAllPayments.bind(this);
  }

  async login(req: Request, res: Response) {
    const { key } = req.body;
    const adminKey = process.env.ADMIN_KEY;
    const secret = process.env.JWT_SECRET;

    try {
      if (!adminKey) {
        throw new Error("ADMIN_KEY is not defined in env");
      }
      if (!secret) {
        throw new Error("JWT_SECRET is not defined in env");
      }

      if (key === adminKey) {
        const payload = { role: "admin" };
        const token = jwt.sign(payload, secret, { expiresIn: "1d" });
        res.status(200).json({ token });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (e) {
      AdminController.handleError(e, res);
    }
  }
  //////////////////////////////////////////////
  /////                                   //////
  /////              USERS                //////
  /////                                   //////
  //////////////////////////////////////////////
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await this.userModel.getAll();
      res.status(200).json(users);
    } catch (e) {
      AdminController.handleError(e, res);
    }
  }
  async getOneUser(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    try {
      const user = await this.userModel.getById(id);
      res.status(200).json(user);
    } catch (e) {
      AdminController.handleError(e, res);
    }
  }
  async editUser(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const user = req.body;
    try {
      const updatedUser = await this.userModel.update(id, user);
      res.status(200).json(updatedUser);
    } catch (e) {
      AdminController.handleError(e, res);
    }
  }
  async deleteUser(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    try {
      const resp = await this.userModel.delete(id);
      if (!resp) {
        throw "Cannot delete user";
      }
      res.status(200).json({ message: "User deleted" });
    } catch (e) {
      AdminController.handleError(e, res);
    }
  }
  //////////////////////////////////////////////
  /////                                   //////
  /////              Payments             //////
  /////                                   //////
  //////////////////////////////////////////////
  async getAllPayments(req: Request, res: Response) {
    try {
      const payments = await this.paymentModel.getAll();
      res.status(200).json(payments);
    } catch (e) {
      AdminController.handleError(e, res);
    }
  }
}
