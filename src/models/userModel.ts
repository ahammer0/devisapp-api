import { userCreate, user } from "../types/users";
import Model from "../utilities/Model";
import ErrorResponse from "../utilities/ErrorResponse";

export default class UserModel extends Model {
  async create(data: userCreate): Promise<user> {
    try {
      const res = await this.db.query("INSERT INTO users SET ?", data);
      if (res.affectedRows !== 1) {
        throw new ErrorResponse("Could not insert user", 400);
      }
      const recordedItem = await this.getById(res.insertId);
      return recordedItem;
    } catch (e: unknown) {
      if (
        e &&
        typeof e === "object" &&
        "code" in e &&
        e.code === "ER_DUP_ENTRY"
      ) {
        throw new Error("Email already exists");
      } else {
        throw e;
      }
    }
  }

  async getAll(): Promise<user[]> {
    const res = await this.db.query("SELECT * FROM users");
    if (res.length === 0) {
      throw new ErrorResponse("No results ", 204);
    }
    return [...res.map((item: user) => ({ ...item }))];
  }

  async getById(id: number): Promise<user> {
    const res = await this.db.query("SELECT * FROM users WHERE id = ?", id);
    if (res.length === 0) {
      throw new ErrorResponse("No results ", 204);
    }
    return { ...res[0] };
  }

  async getByEmail(email: string): Promise<user> {
    const res = await this.db.query(
      "SELECT * FROM users WHERE email = ?",
      email,
    );
    if (res.length === 0) {
      throw new ErrorResponse("No results ", 204);
    }
    return { ...res[0] };
  }

  async update(id: number, user: Partial<Omit<user, "id">>): Promise<user> {
    const res = await this.db.query("UPDATE users SET ? WHERE id = ?", [
      user,
      id,
    ]);
    if (res.affectedRows !== 1) {
      throw new ErrorResponse("Could not update user", 400);
    }
    const recordedItem = await this.getById(id);
    return recordedItem;
  }

  async delete(id: number): Promise<boolean> {
    const sqlCustomers = `delete from customers where user_id=?`;
    const sqlQuotes = "delete from quotes where user_id=?";
    //quote_elements will cascade
    //quote_medias will cascade
    const sqlTickets = "delete from tickets where user_id=?";
    const sqlWorks = "delete from works where user_id=?";
    const sqlUsers = "update users set account_status='deleted' where id=?";

    try {
      await this.db.beginTransaction();

      await this.db.query(sqlQuotes, id);
      await this.db.query(sqlCustomers, id);
      await this.db.query(sqlTickets, id);
      await this.db.query(sqlWorks, id);
      await this.db.query(sqlUsers, id);

      await this.db.commit();
    } catch {
      await this.db.rollback();
      await this.db.commit();
      throw new ErrorResponse("Could not delete user", 500);
    }
    return true;
  }
}
