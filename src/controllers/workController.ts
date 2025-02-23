import { Connection } from "promise-mysql";
import { Response } from "express";
import WorkModel from "../models/workModel";
import { workCreate } from "../types/works";
import Controller from "../utilities/Controller";
import { ReqWithId } from "../types/misc";
import ErrorResponse from "../utilities/ErrorResponse";
import { Schema } from "../utilities/DTO";

export default class WorkController extends Controller {
  workModel: WorkModel;

  constructor(db: Connection) {
    super(db);
    this.workModel = new WorkModel(this.db);

    this.createWork = this.createWork.bind(this);
    this.getAllWorks = this.getAllWorks.bind(this);
    this.getWorkById = this.getWorkById.bind(this);
    this.editWorkById = this.editWorkById.bind(this);
    this.deleteWorkById = this.deleteWorkById.bind(this);
  }

  async createWork(req: ReqWithId, res: Response) {
    //TODO:
    const newWork: workCreate = req.body;

    try {
      if (!req.id) {
        throw new ErrorResponse("Unauthorized: Token not found", 401);
      }
      newWork.user_id = req.id;
      const work = await this.workModel.create(newWork);
      res.status(201).json(work);
    } catch (e) {
      WorkController.handleError(e, res);
    }
  }
  async getAllWorks(req: ReqWithId, res: Response) {
    try {
      if (!req.id) {
        throw new ErrorResponse("Unauthorized: Token not found", 401);
      }
      const id = req.id;
      const works = await this.workModel.getAllByUserId(id);
      res.status(200).json(works);
    } catch (e) {
      WorkController.handleError(e, res);
    }
  }

  async getWorkById(req: ReqWithId, res: Response) {
    try {
      if (!req.id) {
        throw new ErrorResponse("Unauthorized: Token not found", 401);
      }
      const userId: number = req.id;
      const work = await this.workModel.getByIdByUserId(
        Schema.validateNumber(req.params.id),
        userId,
      );
      res.status(200).json(work);
    } catch (e) {
      WorkController.handleError(e, res);
    }
  }

  async editWorkById(req: ReqWithId, res: Response) {
    try {
      if (!req.id) {
        throw new ErrorResponse("Unauthorized: Token not found", 401);
      }
      const userId: number = req.id;

      //TODO:
      const work = await this.workModel.updateByidByUserId(
        parseInt(req.params.id),
        userId,
        req.body,
      );
      res.status(200).json(work);
    } catch (e) {
      WorkController.handleError(e, res);
    }
  }

  async deleteWorkById(req: ReqWithId, res: Response) {
    try {
      if (!req.id) {
        throw new ErrorResponse("Unauthorized: Token not found", 401);
      }
      const userId = req.id;
      const work = await this.workModel.deleteByIdByUserId(
        Schema.validateNumber(req.params.id),
        userId,
      );
      res.status(200).json(work);
    } catch (e) {
      WorkController.handleError(e, res);
    }
  }
}
