import type { payment, paymentCreate } from "../types/payments";
import Model from "../utilities/Model";
import ErrorResponse from "../utilities/ErrorResponse";
import { user } from "../types/users";
import { assertDate, isPast } from "../utilities/datesHandlers";

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
  async getByUserIdByPi(user_id: number, pi: string): Promise<payment | null> {
    const res = await this.db.query(
      "SELECT * FROM payments WHERE user_id = ? and stripe_pi=?",
      [user_id, pi],
    );
    if (res.length === 0) {
      return null;
    }
    return { ...res[0] };
  }
  async setValidByPi(pi: string) {
    //retrieving corresponding user
    const sql =
      "select * from users where id=(select user_id from payments where stripe_pi=?)";
    const userRes = await this.db.query(sql, pi);
    if (userRes.length === 0) {
      throw new ErrorResponse("Could not find user", 400);
    }
    const user = userRes[0] as user;
    //retrieving payment
    const paymentsRes = await this.db.query(
      "select * from payments where stripe_pi=?",
      pi,
    );
    const payment = paymentsRes[0] as payment;

    if (payment.is_valid) {
      return;
    }

    //start transaction to update payments and user expiration
    await this.db.beginTransaction();
    const paymentsUpdateRes = await this.db.query(
      "UPDATE payments SET is_valid=1 WHERE stripe_pi=? ",
      pi,
    );
    if (paymentsUpdateRes.affectedRows === 0) {
      await this.db.rollback();
      throw new ErrorResponse("Could not update payment", 400);
    }

    //compute plan
    let monthToAdd: 3 | 12;
    switch (payment.amount) {
      case 30:
        monthToAdd = 3;
        break;
      case 100:
        monthToAdd = 12;
        break;
      default:
        await this.db.rollback();
        throw new ErrorResponse(
          "Invalid payment amount stored in database",
          500,
        );
    }

    //calculate new expiration date
    let newDate: Date;
    if (isPast(user.expires_at)) {
      newDate = new Date();
    } else {
      newDate = assertDate(user.expires_at);
    }
    newDate.setMonth(newDate.getMonth() + monthToAdd);

    //do update user
    const userUpdateRes = await this.db.query(
      "UPDATE users SET expires_at=? WHERE id=?",
      [newDate, user.id],
    );
    if (userUpdateRes.affectedRows === 0) {
      await this.db.rollback();
      throw new ErrorResponse("Could not update user", 400);
    }

    await this.db.commit();
  }
}
