import { userCreate, user } from "../types/users";
import Model from "../utilities/Model";
import ErrorResponse from "../utilities/ErrorResponse";

export default class UserModel extends Model {
  async create(data: userCreate): Promise<user | null> {
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
        throw new ErrorResponse("Email already exists", 400);
      } else {
        throw e;
      }
    }
  }

  async getAll(): Promise<user[] | null> {
    const res = await this.db.query("SELECT * FROM users");
    if (res.length === 0) {
      throw new ErrorResponse("No results ", 204);
    }
    return [...res.map((item: user) => ({ ...item }))];
  }

  async getById(id: number): Promise<user | null> {
    const res = await this.db.query("SELECT * FROM users WHERE id = ?", id);
    if (res.length === 0) {
      throw new ErrorResponse("No results ", 204);
    }
    return { ...res[0] };
  }

  async getByEmail(email: string): Promise<user | null> {
    const res = await this.db.query(
      "SELECT * FROM users WHERE email = ?",
      email
    );
    if (res.length === 0) {
      throw new ErrorResponse("No results ", 204);
    }
    return { ...res[0] };
  }

  async update(
    id: number,
    user: Partial<Omit<user, "id">>
  ): Promise<user | null> {
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

  async delete(id: number): Promise<boolean | null> {
    const res = await this.db.query("DELETE FROM users WHERE id = ?", id);
    if (res.affectedRows !== 1) {
      throw new ErrorResponse("Could not delete user", 400);
    }
    return true;
  }
}
