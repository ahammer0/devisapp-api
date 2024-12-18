import {Connection} from "promise-mysql";
import ErrorResponse from "./ErrorResponse";  
import {Response} from "express";

export default abstract class Controller {
  db: Connection
  constructor(db: Connection) {
    this.db = db;
  }
  static handleError(err: any,res:Response):void {
    if (err instanceof ErrorResponse) {
      res.status(err.code).json({ message: err.message });
      return;
    }
    if (typeof err === "string") {
      res.status(500).json({ message: err });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
    return 
  }
}
