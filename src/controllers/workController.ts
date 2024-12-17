import { Connection } from "promise-mysql";
import { Request, Response } from "express";
import WorkModel from "../models/workModel";
import { workCreate } from "../types/works";

export default class WorkController {
  db: Connection;
  workModel: WorkModel;

  constructor(db: Connection) {
    this.db = db;
    this.workModel = new WorkModel(this.db);

    this.createWork = this.createWork.bind(this);
    this.getAllWorks = this.getAllWorks.bind(this);
    this.getWorkById = this.getWorkById.bind(this);
    this.editWorkById = this.editWorkById.bind(this);
    this.deleteWorkById = this.deleteWorkById.bind(this);
  }

  async createWork(req: Request, res: Response) {
    const newWork: workCreate = req.body;

    //@ts-ignore
    newWork.user_id = req.id;
    try {
      const work = await this.workModel.create(newWork);
      res.status(201).json(work);
    } catch (e) {
      if (typeof e === "string") {
        res.status(500).json({ message: e });
      } else {
        res.status(500).json({ message: "une erreur s'est produite" });
      }
    }
  }
  async getAllWorks(req: Request, res: Response) {
    //@ts-ignore
    const id = req.id;
    try {
      const works = await this.workModel.getAllByUserId(id);
      res.status(200).json(works);
    } catch (e) {
      if (typeof e === "string") {
        res.status(500).json({ message: e });
      } else {
        res.status(500).json({ message: "une erreur s'est produite" });
      }
    }
  }

  async getWorkById(req: Request, res: Response) {
    //@ts-ignore
    const userId: number = req.id;
    try {
      const work = await this.workModel.getByIdByUserId(
        parseInt(req.params.id),
        userId
      );
      res.status(200).json(work);
    } catch (e) {
      if (typeof e === "string") {
        res.status(500).json({ message: e });
      } else{
        res.status(500).json({ message: "une erreur s'est produite" });
      }
    }
  }

  async editWorkById(req: Request, res: Response) {
    //@ts-ignore
    const userId: number = req.id;

    try {
      const work = await this.workModel.updateByidByUserId(
        parseInt(req.params.id),
        userId,
        req.body
      );
      res.status(200).json(work);
    } catch (e) {
      if (typeof e === "string") {
        res.status(500).json({ message: e });
      } else {
        res.status(500).json({ message: "une erreur s'est produite" });
      }
    }
  }

  async deleteWorkById(req: Request, res: Response) {
    //@ts-ignore
    const userId: number = parseInt(req.id);
    try {
      const work = await this.workModel.deleteByIdByUserId(parseInt(req.params.id),userId);
      res.status(200).json(work);
    } catch (e) {
      if (typeof e === "string") {
        res.status(500).json({ message: e });
      } else {
        res.status(500).json({ message: "une erreur s'est produite" });
      }
    }
  }
}
