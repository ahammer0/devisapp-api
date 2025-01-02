import { Connection } from "promise-mysql";

export default abstract class Model {
  db: Connection;
  constructor(db: Connection) {
    this.db = db;
  }
}
