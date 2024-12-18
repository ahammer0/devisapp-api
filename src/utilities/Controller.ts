import { Connection } from "promise-mysql";
import ErrorResponse from "./ErrorResponse";
import { Response } from "express";

export default abstract class Controller {
  db: Connection;
  constructor(db: Connection) {
    this.db = db;
  }
  static handleError(err: any, res: Response): void {
    const env = process.env.ENV;
    if (env === undefined || !(env === "dev" || env === "prod")) {
      throw new Error(
        "ENV is not defined in .env file, it must be dev or prod"
      );
    }

    if (err instanceof ErrorResponse) {
      res.status(err.code).json({ message: err.message });
      if (env === "dev") console.error(err.message);
      return;
    }
    if (typeof err === "string") {
      res.status(500).json({ message: err });
      return;
    }

    if (env === "dev") {
      console.error(err);
      res.status(500).json({ err });
      return;
    } else {
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
}
