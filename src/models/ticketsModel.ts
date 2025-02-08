import Model from "../utilities/Model";
import ErrorResponse from "../utilities/ErrorResponse";
import {
  ticketCreate,
  rawTicketWCompanyName,
  ticket,
  rawTicket,
} from "../types/tickets";

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
  async getAllByUserId(userId: number): Promise<rawTicket[]> {
    const sql = `SELECT * FROM tickets WHERE user_id=?`;
    const res = await this.db.query(sql, [userId]);
    return [...res];
  }
  //////////////////////////////////
  async getAllOpen(): Promise<rawTicketWCompanyName[]> {
    const sql = `SELECT tickets.*,users.company_name FROM tickets INNER JOIN users on tickets.user_id=users.id WHERE status="open"`;
    const res = await this.db.query(sql);
    return [...res];
  }
  //////////////////////////////////
  async getByIdByUserId(id: number, userId: number): Promise<ticket> {
    const sql = `SELECT * FROM tickets WHERE id=? AND user_id = ?`;
    const res = await this.db.query(sql, [id, userId]);
    if (res.length === 0) throw new ErrorResponse("No results", 204);
    return res[0];
  }
  //////////////////////////////////
  async getById(id: number): Promise<rawTicketWCompanyName> {
    const sql = `SELECT tickets.*,users.company_name FROM tickets iNNER JOIN users on tickets.user_id=users.id WHERE tickets.id=?`;
    const res = await this.db.query(sql, [id]);
    if (res.length === 0) throw new ErrorResponse("No results", 204);
    return res[0];
  }

  //////        UPDATE        //////
  async closeTicket(id: number) {
    const sql = `UPDATE tickets SET status="closed" WHERE id=?`;
    const res = await this.db.query(sql, [id]);
    if (res.affectedRows === 0)
      throw new ErrorResponse("Ticket not found", 404);
  }
  async setTicketResponse(id: number, response: string) {
    const sql = `UPDATE tickets SET response=? WHERE id=?`;
    const res = await this.db.query(sql, [response, id]);
    if (res.affectedRows === 0)
      throw new ErrorResponse("Ticket not found", 404);
  }
  //////        DELETE        //////
  async deleteByIdByUserId(id: number, userId: number) {
    const sql = `DELETE FROM tickets WHERE id=? AND user_id=?`;
    const res = await this.db.query(sql, [id, userId]);
    if (res.affectedRows === 0)
      throw new ErrorResponse("No matching id for user", 404);
  }
}
