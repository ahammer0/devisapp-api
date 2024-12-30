import { workCreate, work } from "../types/works";
import ErrorResponse from "../utilities/ErrorResponse";
import Model from "../utilities/Model";

export default class WorkModel extends Model {
  async create(work: workCreate): Promise<work | null> {
    const res = await this.db.query("INSERT INTO works SET ?", work);
    if (res.affectedRows !== 1) {
      throw new ErrorResponse("Could not insert work", 400);
    }
    const recordedItem = await this.getById(res.insertId);
    return recordedItem;
  }
  async getAll(): Promise<work[] | null> {
    const res = await this.db.query("SELECT * FROM works");
    if (res.length === 0) {
      throw new ErrorResponse("No results ", 204);
    }
    return [...res.map((item: any) => ({ ...item }))];
  }

  async getAllByUserId(id: number): Promise<work[] | null> {
    const res = await this.db.query(
      "SELECT * FROM works WHERE user_id = ?",
      id
    );
    if (res.length === 0) {
      throw new ErrorResponse("No results ", 204);
    }
    return [...res.map((item: any) => ({ ...item }))];
  }
  async getById(id: number): Promise<work | null> {
    const res = await this.db.query("SELECT * FROM works WHERE id = ?", [id]);
    if (res.length === 0) {
      throw new ErrorResponse("No results ", 204);
    }
    return { ...res[0] };
  }

  async getByIdByUserId(id: number, user_id: number): Promise<work | null> {
    const res = await this.db.query(
      "SELECT * FROM works WHERE id = ? AND user_id = ?",
      [id, user_id]
    );
    if (res.length === 0) {
      throw new ErrorResponse("No results ", 204);
    }
    return { ...res[0] };
  }
  async updateByidByUserId(
    id: number,
    userId: number,
    work: Partial<Omit<work, "id"|"user_id">>
  ): Promise<work | null> {
    const res = await this.db.query(
      "UPDATE works SET ? WHERE id = ? AND user_id = ?",
      [work, id, userId]
    );
    if (res.affectedRows !== 1) {
      throw new ErrorResponse("Could not update work", 400);
    }
    const recordedItem = await this.getByIdByUserId(id, userId);
    return recordedItem;
  }

  async deleteByIdByUserId(
    id: number,
    userId: number
  ): Promise<boolean | null> {
    const res = await this.db.query(
      "DELETE FROM works WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (res.affectedRows !== 1) {
      throw new ErrorResponse("Could not delete work", 400);
    }
    return true;
  }
}
