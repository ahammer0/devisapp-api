import type { payment, paymentCreate } from "../types/payments";
import Model from "../utilities/Model";
import ErrorResponse from "../utilities/ErrorResponse";

export default class PaymentModel extends Model {
  async create(data: paymentCreate): Promise<payment | null> {
    const res = await this.db.query("INSERT INTO payments SET ?", data);
    if (res.affectedRows !== 1) {
      throw new ErrorResponse("Could not insert payment", 400);
    }
    const recordedItem = await this.getById(res.insertId);
    return recordedItem;
  }
  async getAll(): Promise<payment[] | null> {
    const res = await this.db.query(
      "SELECT payments.*,users.company_name as company_name FROM payments INNER JOIN users ON payments.user_id=users.id",
    );
    if (res.length === 0) {
      throw new ErrorResponse("No results ", 204);
    }
    return [...res.map((item: payment) => ({ ...item }))];
  }
  async getById(id: number): Promise<payment | null> {
    const res = await this.db.query("SELECT * FROM payments WHERE id = ?", id);
    if (res.length === 0) {
      throw new ErrorResponse("No results ", 204);
    }
    return { ...res[0] };
  }
}
