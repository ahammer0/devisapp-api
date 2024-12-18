import { Connection } from "promise-mysql";
import { userCreate, user } from "../types/users";

export default class UserModel {
  db: Connection;
  constructor(db: Connection) {
    this.db = db;
  }
  async create(data: userCreate): Promise<user | null> {
    try {
      const res = await this.db.query("INSERT INTO users SET ?", data);
      if (res.affectedRows !== 1) {
        throw null;
      }
      const recordedItem = await this.getById(res.insertId);
      return recordedItem;
    } catch (e: any) {
      if (e.code === "ER_DUP_ENTRY") {
        throw "email déjà utilisée";
      } else {
        throw "une erreur s'est produite";
      }
    }
  }

  async getAll(): Promise<user[] | null> {
    try {
      const res = await this.db.query("SELECT * FROM users");
      if (res.length === 0) {
        throw "Aucun résultat";
      }
      return [...res.map((item: any) => ({ ...item }))];
    } catch (e) {
      throw "une erreur s'est produite";
    }
  }

  async getById(id: number): Promise<user | null> {
    try {
      const res = await this.db.query("SELECT * FROM users WHERE id = ?", id);
      if (res.length === 0) {
        throw "Aucun résultat";
      }
      return { ...res[0] };
    } catch (e) {
      throw "une erreur s'est produite";
    }
  }

  async getByEmail(email: string): Promise<user | null> {
    try {
      const res = await this.db.query(
        "SELECT * FROM users WHERE email = ?",
        email,
      );
      if (res.length === 0) {
        throw "Aucun résultat";
      }
      return { ...res[0] };
    } catch (e) {
      throw "une erreur s'est produite";
    }
  }

  async update(
    id: number,
    user: Partial<Omit<user, "id">>,
  ): Promise<user | null> {
    try {
      const res = await this.db.query("UPDATE users SET ? WHERE id = ?", [
        user,
        id,
      ]);
      if (res.affectedRows !== 1) {
        throw null;
      }
      const recordedItem = await this.getById(id);
      return recordedItem;
    } catch (e) {
      throw "une erreur s'est produite";
    }
  }

  async delete(id: number): Promise<boolean | null> {
    try {
      const res = await this.db.query("DELETE FROM users WHERE id = ?", id);
      if (res.affectedRows !== 1) {
        throw null;
      }
      return true;
    } catch (e) {
      throw "une erreur s'est produite";
    }
  }
}
