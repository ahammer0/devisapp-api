import { Response, Request } from "express";
import { ReqWithId } from "../types/misc";
import { Connection } from "promise-mysql";
import jwt from "jsonwebtoken";
import UserModel from "../models/userModel";
import PaymentModel from "../models/paymentModel";
import TicketModel from "../models/ticketsModel";
import Controller from "../utilities/Controller";
import ErrorResponse from "../utilities/ErrorResponse";
import DTO from "../utilities/DTO";
import { userUpdate } from "../schemas/user";

export default class AdminController extends Controller {
  userModel: UserModel;
  paymentModel: PaymentModel;
  ticketModel: TicketModel;

  constructor(db: Connection) {
    super(db);

    this.userModel = new UserModel(this.db);
    this.paymentModel = new PaymentModel(this.db);
    this.ticketModel = new TicketModel(this.db);

    this.login = this.login.bind(this);

    this.getAllUsers = this.getAllUsers.bind(this);
    this.getOneUser = this.getOneUser.bind(this);
    this.editUser = this.editUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);

    this.getAllPayments = this.getAllPayments.bind(this);

    this.getAllOpenTickets = this.getAllOpenTickets.bind(this);
    this.closeTicket = this.closeTicket.bind(this);
    this.getOneTicket = this.getOneTicket.bind(this);
    this.respondToTicket = this.respondToTicket.bind(this);
  }

  async login(req: Request, res: Response) {
    try {
      const bodyDto = new DTO(req.body, { key: { type: "string" } });
      bodyDto.validate();
      const key = bodyDto.data.key;
      if (!key) throw new ErrorResponse("Bad Request", 400);

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
  async getAllUsers(_req: Request, res: Response) {
    try {
      const users = await this.userModel.getAll();
      res.status(200).json(users);
    } catch (e) {
      AdminController.handleError(e, res);
    }
  }
  async getOneUser(req: Request, res: Response) {
    try {
      const paramsDTO = new DTO(
        { id: parseInt(req.params.id) },
        { id: { type: "number", min: 0 } },
      );
      const id = paramsDTO.data.id;
      const user = await this.userModel.getById(id as number);
      res.status(200).json(user);
    } catch (e) {
      AdminController.handleError(e, res);
    }
  }
  async editUser(req: Request, res: Response) {
    try {
      const paramsDTO = new DTO(
        { id: req.params.id },
        { id: { type: "number", min: 0 } },
      );
      const id = paramsDTO.data.id as number;

      const userDto = new DTO(req.body, userUpdate);
      const user = userDto.data;
      const updatedUser = await this.userModel.update(id, user);
      res.status(200).json(updatedUser);
    } catch (e) {
      AdminController.handleError(e, res);
    }
  }
  async deleteUser(req: Request, res: Response) {
    try {
      const idDto = new DTO(
        { id: req.params.id },
        { id: { type: "number", min: 0 } },
      );
      const id = idDto.data.id as number;
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
  async getAllPayments(_req: Request, res: Response) {
    try {
      const payments = await this.paymentModel.getAll();
      res.status(200).json(payments);
    } catch (e) {
      AdminController.handleError(e, res);
    }
  }
  //////////////////////////////////////////////
  /////                                   //////
  /////              Tickets              //////
  /////                                   //////
  //////////////////////////////////////////////
  async getAllOpenTickets(_req: ReqWithId, res: Response) {
    try {
      const tickets = await this.ticketModel.getAllOpen();
      res.status(200).json(tickets);
    } catch (error) {
      AdminController.handleError(error, res);
    }
  }
  async closeTicket(req: ReqWithId, res: Response) {
    try {
      const idDto = new DTO(
        { id: req.params.id },
        { id: { type: "number", min: 0 } },
      );
      const id = idDto.data.id as number;
      await this.ticketModel.closeTicket(id);
      res.status(200).json("Closed successfully");
    } catch (error) {
      AdminController.handleError(error, res);
    }
  }
  async getOneTicket(req: ReqWithId, res: Response) {
    try {
      const idDto = new DTO(
        { id: req.params.id },
        { id: { type: "number", min: 0 } },
      );
      const id = idDto.data.id as number;
      const ticket = await this.ticketModel.getById(id);
      res.status(200).json(ticket);
    } catch (error) {
      AdminController.handleError(error, res);
    }
  }
  async respondToTicket(req: ReqWithId, res: Response) {
    try {
      const idDto = new DTO(
        { id: req.params.id },
        { id: { type: "number", min: 0 } },
      );
      const id = idDto.data.id as number;

      const bodyDto = new DTO(req.body, { response: { type: "string" } });
      await this.ticketModel.setTicketResponse(
        id,
        bodyDto.data.response as string,
      );
      res.status(200).json("Responded successfully");
    } catch (error) {
      AdminController.handleError(error, res);
    }
  }
}
