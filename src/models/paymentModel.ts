import { Connection } from "promise-mysql";
import type { payment, paymentCreate } from "../types/payments";

export default class PaymentModel {
  db: Connection;

  constructor(db: Connection) {
    this.db = db;
  }

  async create(data: paymentCreate): Promise<payment | null> {
    try {
      const res = await this.db.query("INSERT INTO payments SET ?", data);
      if (res.affectedRows !== 1) {
        throw null;
      }
      const recordedItem = await this.getById(res.insertId);
      return recordedItem;
    } catch (e) {
      if (typeof e === "string") {
        throw e;
      } else {
        throw "une erreur s'est produite";
      }
    }
  }
  async getAll(): Promise<payment[] | null> {
    try {
      const res = await this.db.query("SELECT * FROM payments");
      if (res.length === 0) {
        throw "Aucun résultat";
      }
      return [...res.map((item: payment) => ({ ...item }))];
    } catch (e) {
      if (typeof e === "string") {
        throw e;
      }
      throw "une erreur s'est produite";
    }
  }
  async getById(id: number): Promise<payment | null> {
    const res = await this.db.query("SELECT * FROM payments WHERE id = ?", id);
    if (res.length === 0) {
      throw "Aucun résultat";
    }
    return { ...res[0] };
  }
}
