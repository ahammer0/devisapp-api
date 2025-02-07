import { Connection } from "promise-mysql";
import { Response } from "express";
import TicketModel from "../models/ticketsModel";
import Controller from "../utilities/Controller";
import { ReqWithId } from "../types/misc";
import ErrorResponse from "../utilities/ErrorResponse";
import { ticketCreate } from "../types/tickets";

export default class TicketsController extends Controller {
  ticketsModel: TicketModel;

  constructor(db: Connection) {
    super(db);
    this.ticketsModel = new TicketModel(this.db);

    this.getAllTicketsByUserId = this.getAllTicketsByUserId.bind(this);
    this.getOneTicketByUserId = this.getOneTicketByUserId.bind(this);
    this.createTicket = this.createTicket.bind(this);
  }

  async getAllTicketsByUserId(req: ReqWithId, res: Response) {
    if (!req.id) {
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }
    const userId: number = req.id;
    try {
      const tickets = await this.ticketsModel.getAllByUserId(userId);
      res.status(200).json(tickets);
    } catch (error) {
      TicketsController.handleError(error, res);
    }
  }
  async getOneTicketByUserId(req: ReqWithId, res: Response) {
    if (!req.id) {
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }
    const userId: number = req.id;
    const id = parseInt(req.params.id);
    try {
      const ticket = await this.ticketsModel.getByIdByUserId(id, userId);
      res.status(200).json(ticket);
    } catch (error) {
      TicketsController.handleError(error, res);
    }
  }

  async createTicket(req: ReqWithId, res: Response) {
    if (!req.id) {
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }
    const userId: number = req.id;
    //todo valider le body
    const ticket: ticketCreate = req.body;
    try {
      const ticketCreated = await this.ticketsModel.create(userId, ticket);
      res.status(201).json(ticketCreated);
    } catch (error) {
      TicketsController.handleError(error, res);
    }
  }
}
