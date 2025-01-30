import { Connection } from "promise-mysql";
import ErrorResponse from "./ErrorResponse";
import { Response } from "express";
import { InputError } from "./validators";

export default abstract class Controller {
  db: Connection;
  constructor(db: Connection) {
    this.db = db;
  }
  static handleError(err: unknown, res: Response): void {
    const env = process.env.ENV;
    if (env === undefined || !(env === "dev" || env === "prod")) {
      throw new Error(
        "ENV is not defined in .env file, it must be dev or prod",
      );
    }

    if (err instanceof ErrorResponse) {
      res.status(err.code).json({ message: err.message });
      if (env === "dev") console.error("\x1b[31m", "Error: ", err, "\x1b[0m");
      return;
    }
    if (err instanceof InputError) {
      res.status(422).json({ message: err.message });
      if (env === "dev")
        console.error("\x1b[31m", "Error: ", err.message, "\x1b[0m");
      return;
    }
    if (typeof err === "string") {
      res.status(500).json({ message: err });
      return;
    }

    if (env === "dev") {
      console.error("\x1b[31m", err, "\x1b[0m");
      res.status(500).json({ err });
      return;
    } else {
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  }
}
