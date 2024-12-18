import { Connection } from "promise-mysql";
import { quote, quote_media, quote_element, full_quote } from "../types/quotes";

export default class QuoteModel {
  db: Connection;
  constructor(db: Connection) {
    this.db = db;
  }

  async create(quote: full_quote): Promise<full_quote | null> {
    //base quote
    const { quote_elements, quote_medias, ...base_quote } = quote;
    let recordedItem: full_quote | null = null;

    try {
      const res = await this.db.query("INSERT INTO quotes SET ?", base_quote);
      if (res.affectedRows !== 1) {
        throw new Error("Could not insert quote_base");
      }
      recordedItem = await this.getById(res.insertId);
      const newQuoteId = res.insertId;

      if (!recordedItem) {
        throw new Error("Could not insert quote_base");
      }

      //quote_elements
      const quote_elements = quote.quote_elements.map((el) => ({
        ...el,
        quote_id: newQuoteId,
      }));

      const res2 = await Promise.allSettled(
        quote_elements.map((el) =>
          this.db.query("INSERT INTO quote_elements SET ?", el),
        ),
      );
      if (res2.filter((el) => el.status === "rejected").length > 0) {
        throw new Error("Could not insert quote elements");
      }

      return await this.getById(newQuoteId);
    } catch (e) {
      if (typeof e === "string") {
        throw e;
      } else {
        throw "une erreur s'est produite";
      }
    }
  }
  async getAllByUserId(id: number): Promise<full_quote[] | null> {
    try {
      const res = await this.db.query(
        "SELECT * FROM quotes WHERE user_id = ?",
        id,
      );
      return res;
    } catch (e) {
      if (typeof e === "string") {
        throw e;
      }
      throw "une erreur s'est produite";
    }
  }
  async getByIdByUserId(
    id: number,
    userId: number,
  ): Promise<full_quote | null> {
    try {
      const res = await this.db.query(
        `SELECT *, quotes.id as id, quotes.id as quote_id, quote_elements.id as quote_element_id, quote_medias.id as quote_media_id FROM quotes 
        LEFT JOIN quote_elements ON quotes.id = quote_elements.quote_id 
        LEFT JOIN quote_medias ON quotes.id = quote_medias.quote_id 
        WHERE quotes.id = ? and quotes.user_id = ?`,
        [id, userId],
      );

      const quote_elements = QuoteModel.extractQuoteElementsFromSqlJoin(res);
      const quote_medias = QuoteModel.extractQuoteMediasFromSqlJoin(res);
      const quote_base = QuoteModel.extractQuoteBaseFromSqlJoin(res[0]);

      const recontructed_quote: full_quote = {
        ...quote_base,
        quote_elements,
        quote_medias,
      };

      return recontructed_quote;
    } catch (e) {
      if (typeof e === "string") {
        throw e;
      }
      throw "une erreur s'est produite";
    }
  }

  async getById(id: number): Promise<full_quote | null> {
    try {
      const res = await this.db.query("SELECT * FROM quotes WHERE id = ?", id);
      if (res.length === 0) {
        throw "Aucun résultat";
      }
      const quote_elements = await this.db.query(
        "SELECT * FROM quote_elements WHERE quote_id = ?",
        id,
      );
      const quote_medias = await this.db.query(
        "SELECT * FROM quote_medias WHERE quote_id = ?",
        id,
      );
      return { ...res[0], quote_elements, quote_medias };
    } catch (e) {
      throw "une erreur s'est produite";
    }
  }
  async updateByidByUserId(
    id: number,
    userId: number,
    quote: Partial<Omit<full_quote, "id">>,
  ): Promise<full_quote | null> {
    const { quote_elements, quote_medias, ...base_quote } = quote;
    const sql_base = "UPDATE quotes SET ? WHERE id = ? AND user_id = ?";
    const sql_quote_elements =
      "UPDATE quote_elements SET ? WHERE id = ? AND quote_id = ?";
    const sql_quote_medias =
      "UPDATE quote_medias SET ? WHERE id = ? AND quote_id = ?";

    try {
      const res = await this.db.query(sql_base, [base_quote, id, userId]);
      if (res.affectedRows !== 1) {
        throw "Trying to update a quote that doesn't exist";
      }

      //handling quote_elements and quote_medias
      if (quote_elements && quote_elements.length > 0) {
        const res_elements = await Promise.allSettled(
          quote_elements.map((el) => {
            const { quote_id, ...newEl } = el;
            return this.db.query(sql_quote_elements, [newEl, el.id, id]);
          }),
        );

        if (
          res_elements.filter(
            (el) => el.status === "rejected" || el.value.affectedRows !== 1,
          ).length > 0
        ) {
          throw "Could not update quote elements";
        }
      }

      if (quote_medias && quote_medias.length > 0) {
        const res_medias = await Promise.allSettled(
          quote_medias.map((el) => {
            const { quote_id, ...newEl } = el;
            return this.db.query(sql_quote_medias, [newEl, el.id, id]);
          }),
        );

        if (
          res_medias.filter(
            (el) => el.status === "rejected" || el.value.affectedRows !== 1,
          ).length > 0
        ) {
          throw "Could not update quote medias";
        }
      }

      return await this.getByIdByUserId(id, userId);
    } catch (e) {
      if (typeof e === "string") {
        throw e;
      }
      console.log(e);
      throw "une erreur s'est produite";
    }
  }
  async deleteByIdByUserId(id: number, userId: number): Promise<boolean> {
    const sql = "DELETE FROM quotes WHERE id = ? AND user_id = ?";
    try {
      const res = await this.db.query(sql, [id, userId]);
      if (res.affectedRows !== 1) {
        throw "No matching quote to delete for this user id and quote id";
      }
      return true;
    } catch (e) {
      if (typeof e === "string") {
        throw e;
      }
      throw `Could not delete quote`;
    }
  }

  static extractQuoteElementsFromSqlJoin(
    joinResponse: (quote &
      quote_media &
      quote_element & { quote_media_id: number; quote_element_id: number })[],
  ): quote_element[] {
    const quote_elements = joinResponse.reduce(
      (acc: quote_element[], el: (typeof joinResponse)[0]) => {
        if (el.quote_element_id) {
          const quote_element: quote_element = {
            id: el.quote_element_id,
            quote_id: el.quote_id,
            work_id: el.work_id,
            quote_section: el.quote_section,
            discount: el.discount,
            quantity: el.quantity,
          };
          acc.push(quote_element);
        }
        return acc;
      },
      [],
    );
    return quote_elements;
  }

  static extractQuoteMediasFromSqlJoin(
    joinResponse: (quote &
      quote_media &
      quote_element & { quote_media_id: number; quote_element_id: number })[],
  ): quote_media[] {
    const quote_medias = joinResponse.reduce(
      (acc: quote_media[], el: (typeof joinResponse)[0]) => {
        if (el.quote_media_id) {
          const quote_media: quote_media = {
            id: el.quote_media_id,
            path_name: el.path_name,
            alt_text: el.alt_text,
            quote_id: el.quote_id,
          };
          acc.push(quote_media);
        }
        return acc;
      },
      [],
    );
    return quote_medias;
  }

  static extractQuoteBaseFromSqlJoin(
    joinResponse: quote &
      quote_media &
      quote_element & { quote_media_id: number; quote_element_id: number },
  ): quote {
    const quote_base = {
      id: joinResponse.quote_id,
      user_id: joinResponse.user_id,
      global_discount: joinResponse.global_discount,
      general_infos: joinResponse.general_infos,
      status: joinResponse.status,
      expires_at: joinResponse.expires_at,
      created_at: joinResponse.created_at,
    };
    return quote_base;
  }
}
