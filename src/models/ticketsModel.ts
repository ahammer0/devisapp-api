import Model from "../utilities/Model";
import ErrorResponse from "../utilities/ErrorResponse";
import { ticketCreate } from "../types/tickets";

export default class TicketsModel extends Model {
  //////////////////////////////////////////
  //                                      //
  //     INSTANCE METHODS                 //
  //                                      //
  //////////////////////////////////////////
  //////        CREATE        //////
  async create(userId: number, ticket: ticketCreate) {
    const sql = `INSERT INTO tickets (user_id,object, text_content) VALUES (?,?,?)`;
    const res = await this.db.query(sql, [
      userId,
      ticket.object,
      ticket.text_content,
    ]);

    if (res.affectedRows !== 1) {
      throw new ErrorResponse("Could not insert ticket", 400);
    }
  }
  //////        READ          //////
  async getAllByUserId(userId: number) {
    const sql = `SELECT * FROM tickets WHERE user_id=?`;
    const res = await this.db.query(sql, [userId]);
    return [...res];
  }

  //////////////////////////////////
  async getByIdByUserId(id: number, userId: number) {
    const sql = `SELECT * FROM tickets WHERE id=? AND user_id = ?`;
    const res = await this.db.query(sql, [id, userId]);
    if (res.length === 0) throw new ErrorResponse("No results", 204);
    return res[0];
  }

  //////        UPDATE        //////
  //////        DELETE        //////
  async deleteByIdByUserId(id: number, userId: number) {
    const sql = `DELETE FROM tickets WHERE id=? AND user_id=?`;
    const res = await this.db.query(sql, [id, userId]);
    if (res.affectedRows === 0)
      throw new ErrorResponse("No matching id for user", 404);
  }
}
