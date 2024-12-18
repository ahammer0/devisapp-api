import { Connection } from "promise-mysql";
import { Response, Request } from "express";
import jwt from "jsonwebtoken";

export default class AdminController {
  db: Connection;

  constructor(db: Connection) {
    this.db = db;

    this.login = this.login.bind(this);

    this.getAllUsers = this.getAllUsers.bind(this);
    this.getOneUser = this.getOneUser.bind(this);
    this.editUser = this.editUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);

    this.getAllPayments = this.getAllPayments.bind(this);
  }

  //TODO refacto to take same time if no email found
  async login(req: Request, res: Response) {
    const { key } = req.body;
    const adminKey = process.env.ADMIN_KEY;
    const secret = process.env.JWT_SECRET;

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
    }
    else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  }
  //////////////////////////////////////////////
  /////                                   //////
  /////              USERS                //////
  /////                                   //////
  //////////////////////////////////////////////
  async getAllUsers(req: Request, res: Response) {
    res.send("getAllUsers");
  }
  async getOneUser(req: Request, res: Response) {
    const id = req.params.id;
    res.send("getOneUser"+id);
  }
  async editUser(req: Request, res: Response) {
    const id = req.params.id;
    res.send("editUser"+id);
  }
  async deleteUser(req: Request, res: Response) {
    const id = req.params.id;
    res.send("deleteUser"+id);
  }
  //////////////////////////////////////////////
  /////                                   //////
  /////              Payments             //////
  /////                                   //////
  //////////////////////////////////////////////
  async getAllPayments(req: Request, res: Response) {
    res.send("getAllPayments");
  }



























}
