import QuoteModel from "../models/quoteModel";
import { Connection } from "promise-mysql";
import { Response } from "express";
import Controller from "../utilities/Controller";
import { ReqWithId } from "../types/misc";
import ErrorResponse from "../utilities/ErrorResponse";
import { quote_full_create } from "../types/quotes";
import WorkModel from "../models/workModel";
import UserModel from "../models/userModel";
import getQuotePdfStream from "../utilities/QuotePdfComponent";
import { isPast } from "../utilities/datesHandlers";

export default class QuotesController extends Controller {
  quoteModel: QuoteModel;
  workModel: WorkModel;
  userModel: UserModel;

  constructor(db: Connection) {
    super(db);
    this.quoteModel = new QuoteModel(this.db);
    this.workModel = new WorkModel(this.db);
    this.userModel = new UserModel(this.db);

    this.addQuote = this.addQuote.bind(this);
    this.getAllQuotes = this.getAllQuotes.bind(this);
    this.getOneQuote = this.getOneQuote.bind(this);
    this.editQuote = this.editQuote.bind(this);
    this.deleteQuote = this.deleteQuote.bind(this);
    this.getQuotePdf = this.getQuotePdf.bind(this);
    this.addMedia = this.addMedia.bind(this);
    this.getMedia = this.getMedia.bind(this);
    this.deleteMedia = this.deleteMedia.bind(this);
  }
  async addQuote(req: ReqWithId, res: Response) {
    if (!req.id) {
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }

    const newQuote: quote_full_create = req.body;
    newQuote.expires_at = new Date(
      newQuote.expires_at ?? new Date(),
    ).toISOString();

    const id = req.id;
    newQuote.user_id = id;
    try {
      const quote = await this.quoteModel.create(newQuote);
      res.status(201).json(quote);
    } catch (e) {
      QuotesController.handleError(e, res);
    }
  }

  async addMedia(req: ReqWithId, res: Response) {
    try {
      //Validating data
      if (!req.id) {
        throw new ErrorResponse("Unauthorized: Token not found", 401);
      }
      if (!req?.files?.image || !("data" in req?.files?.image))
        throw new ErrorResponse("No file in request", 422);
      if (!req.body.quoteId)
        throw new ErrorResponse("No quoteId specified in request", 422);

      const media = await this.quoteModel.createMedia(
        req.files.image.data,
        req.id,
        req.body.quoteId,
      );
      res.status(201).json(media);
    } catch (e) {
      QuotesController.handleError(e, res);
    }
  }
  async getMedia(req: ReqWithId, res: Response) {
    try {
      //Validating data
      if (!req.id) {
        throw new ErrorResponse("Unauthorized: Token not found", 401);
      }
      const filePath = await this.quoteModel.getMediaByIdByUserId(
        parseInt(req.params.id),
        req.id,
      );
      if (!filePath) throw new ErrorResponse("Requested media not found", 404);

      res.sendFile(`${process.cwd()}/privateImages/${filePath}.webp`);
    } catch (e) {
      QuotesController.handleError(e, res);
    }
  }
  async getAllQuotes(req: ReqWithId, res: Response) {
    if (!req.id) {
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
    if (!req.id) {
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
    if (!req.id) {
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
    if (!req.id) {
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
  async getQuotePdf(req: ReqWithId, res: Response) {
    //validating req body
    const quoteId = parseInt(req.params.id);
    if (!quoteId || isNaN(quoteId)) throw new ErrorResponse("Bad Request", 400);
    if (!req.id) throw new ErrorResponse("Authentification Failed", 401);
    try {
      const userRes = this.userModel.getById(req.id);
      const quoteRes = this.quoteModel.getByIdByUserId(quoteId, req.id);
      const worksRes = this.workModel.getAllByUserId(req.id);

      const [user, quote, works] = await Promise.all([
        userRes,
        quoteRes,
        worksRes,
      ]);

      //check if user account is valid
      if (isPast(user.expires_at)) {
        throw new ErrorResponse("Payment required", 402);
      }

      //now we have all we need
      const pdfStream = await getQuotePdfStream(user, quote, works);
      res.setHeader("Content-Type", "application/pdf");
      pdfStream.pipe(res);
    } catch (e) {
      QuotesController.handleError(e, res);
    }
  }
  async deleteMedia(req: ReqWithId, res: Response) {
    if (!req.id) {
      throw new ErrorResponse("Unauthorized: Token not found", 401);
    }
    const mediaId = parseInt(req.params.id);
    try {
      await this.quoteModel.deleteMediaByIdByUserId(mediaId, req.id);
      res.status(200).json(true);
    } catch (e) {
      QuotesController.handleError(e, res);
    }
  }
}
