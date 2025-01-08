import QuoteModel from "../models/quoteModel";
import { Connection } from "promise-mysql";
import { Response } from "express";
import Controller from "../utilities/Controller";
import {ReqWithId} from "../types/misc";
import ErrorResponse from "../utilities/ErrorResponse";
import {quote_full_create} from "../types/quotes";

export default class QuotesController extends Controller {
  quoteModel: QuoteModel;

  constructor(db: Connection) {
    super(db);
    this.quoteModel = new QuoteModel(this.db);

    this.addQuote = this.addQuote.bind(this);
    this.getAllQuotes = this.getAllQuotes.bind(this);
    this.getOneQuote = this.getOneQuote.bind(this);
    this.editQuote = this.editQuote.bind(this);
    this.deleteQuote = this.deleteQuote.bind(this);
  }
  async addQuote(req: ReqWithId, res: Response) {
    if(!req.id){
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }

    const newQuote:quote_full_create = req.body;
    newQuote.expires_at = new Date(newQuote.expires_at??new Date()).toISOString();

    const id = req.id;
    newQuote.user_id = id;
    try {
      const quote = await this.quoteModel.create(newQuote);
      res.status(201).json(quote);
    } catch (e) {
      QuotesController.handleError(e, res);
    }
  }
  async getAllQuotes(req: ReqWithId, res: Response) {
    if(!req.id){
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }
    const id = req.id;
    try {
      const quotes = await this.quoteModel.getAllByUserId(id);
      res.status(200).json(quotes);
    } catch (e) {
      QuotesController.handleError(e, res);
    }
  }
  async getOneQuote(req: ReqWithId, res: Response) {
    if(!req.id){
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }
    const userId = req.id;
    const quoteId = parseInt(req.params.id);
    try {
      const quote = await this.quoteModel.getByIdByUserId(quoteId, userId);
      res.status(200).json(quote);
    } catch (e) {
      QuotesController.handleError(e, res);
    }
  }

  async editQuote(req: ReqWithId, res: Response) {
    if(!req.id){
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }
    const userId = req.id;
    const quoteId = parseInt(req.params.id);
    const quote = req.body;
    //formatting dates
    quote.expires_at = new Date(quote.expires_at);
    quote.created_at = new Date(quote.created_at);

    try {
      const updatedQuote = await this.quoteModel.updateByidByUserId(
        quoteId,
        userId,
        req.body,
      );
      res.status(200).json(updatedQuote);
    } catch (e) {
      QuotesController.handleError(e, res);
    }
  }
  async deleteQuote(req: ReqWithId, res: Response) {
    if(!req.id){
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }
    const userId = req.id;
    const quoteId = parseInt(req.params.id);
    try {
      const quote = await this.quoteModel.deleteByIdByUserId(quoteId, userId);
      res.status(200).json(quote);
    } catch (e) {
      QuotesController.handleError(e, res);
    }
  }
}
