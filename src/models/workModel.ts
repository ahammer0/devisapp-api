import {Connection} from "promise-mysql";
import {workCreate,work} from "../types/works";

export default class WorkModel {
  db: Connection
  constructor(db: Connection) {
    this.db = db;
  }
  async create(work:workCreate):Promise<work | null> {
    try {
      const res = await this.db.query("INSERT INTO works SET ?", work);
      if (res.affectedRows !== 1) {
        throw null;
      }
      const recordedItem = await this.getById(res.insertId);
      return recordedItem;
    } catch (e) {
      console.log(e)
      throw "une erreur s'est produite";
    }
  }
  async getAll(): Promise<work[] | null> {
    try {
      const res = await this.db.query("SELECT * FROM works");
      if (res.length === 0) {
        throw "Aucun résultat";
      }
      return [...res.map((item: any) => ({ ...item }))];
    } catch (e) {
      throw "une erreur s'est produite";
    }
  }

  async getAllByUserId(id: number): Promise<work[] | null> {
    try {
      const res = await this.db.query("SELECT * FROM works WHERE user_id = ?", id);
      if (res.length === 0) {
        throw "Aucun résultat";
      }
      return [...res.map((item: any) => ({ ...item }))];
    } catch (e) {
      throw "une erreur s'est produite";
    }
  }
  async getById (id: number): Promise<work | null> {
    try {
      const res = await this.db.query("SELECT * FROM works WHERE id = ?", [id]);
      if (res.length === 0) {
        throw "Aucun résultat";
      }
      return { ...res[0] };
    } catch (e) {
      throw "une erreur s'est produite";
    }
  }

  async getByIdByUserId (id: number, user_id: number): Promise<work | null> {
    try {
      const res = await this.db.query("SELECT * FROM works WHERE id = ? AND user_id = ?", [id, user_id]);
      if (res.length === 0) {
        throw "Aucun résultat";
      }
      return { ...res[0] };
    } catch (e) {
      throw "une erreur s'est produite";
    }
  }
  async updateByidByUserId(id:number,userId:number, work:Partial<Omit<work,'id'>>): Promise<work | null> {
    try {
      const res = await this.db.query("UPDATE works SET ? WHERE id = ? AND user_id = ?", [work, id,userId]);
      if (res.affectedRows !== 1) {
        throw null;
      }
      const recordedItem = await this.getByIdByUserId(id,userId);
      return recordedItem;
    } catch (e) {
      throw "une erreur s'est produite";
    }
  }

  async deleteByIdByUserId(id: number,userId:number): Promise<boolean | null> {
    try {
      const res = await this.db.query("DELETE FROM works WHERE id = ? AND user_id = ?", [id,userId]);
      if (res.affectedRows !== 1) {
        throw null;
      }
      return true
    } catch (e) {
      throw "une erreur s'est produite";
    }
  }


}
