import {
  quote,
  quote_media,
  quote_element,
  full_quote,
  quote_full_create,
} from "../types/quotes";
import Model from "../utilities/Model";
import ErrorResponse from "../utilities/ErrorResponse";
import { customer } from "../types/customers";

export default class QuoteModel extends Model {
  //////////////////////////////////////////
  //                                      //
  //     INSTANCE METHODS                 //
  //                                      //
  //////////////////////////////////////////

  //////        CREATE        //////
  async create(quote: quote_full_create): Promise<full_quote> {
    //base quote
    const { customer, quote_elements, quote_medias: _a, ...base_quote } = quote;
    if (base_quote.expires_at) {
      base_quote.expires_at = new Date(base_quote.expires_at);
    }
    let recordedItem: full_quote | null = null;

    //if new customer record it
    if (customer) {
      const insertCustomerRes = await this.db.query(
        "INSERT INTO customers SET ?",
        customer,
      );
      if (insertCustomerRes.affectedRows !== 1) {
        throw new ErrorResponse(
          "Could not insert customer when creating quote",
          400,
        );
      }
      base_quote.customer_id = insertCustomerRes.insertId;
    }

    // recording base quote
    const res = await this.db.query("INSERT INTO quotes SET ?", base_quote);
    if (res.affectedRows !== 1) {
      throw new ErrorResponse("Could not insert quote_base", 400);
    }
    recordedItem = await this.getById(res.insertId);
    const newQuoteId = res.insertId;

    if (!recordedItem) {
      throw new ErrorResponse("Could not insert quote_base", 400);
    }

    //quote_elements
    if (quote_elements) {
      const newQuote_elements = quote_elements.map((el) => ({
        ...el,
        quote_id: newQuoteId,
      }));

      const res2 = await Promise.allSettled(
        newQuote_elements.map((el) =>
          this.db.query("INSERT INTO quote_elements SET ?", el),
        ),
      );
      if (res2.filter((el) => el.status === "rejected").length > 0) {
        throw new ErrorResponse(
          "Could not insert quote_elements after inserting quote",
          400,
        );
      }
    }

    //returning created quote
    return await this.getById(newQuoteId);
  }

  //////        READ          //////
  //////////////////////////////////////////
  async getAllByUserId(id: number): Promise<full_quote[]> {
    const res = await this.db.query(
      "SELECT id FROM quotes WHERE user_id = ?",
      id,
    );
    const resFinal = res.map((item: { id: number }) =>
      this.getByIdByUserId(item.id, id),
    );
    return Promise.all(resFinal);
  }

  //////////////////////////////////////////
  async getByIdByUserId(id: number, userId: number): Promise<full_quote> {
    const res = await this.db.query(
      `SELECT *, 
        quotes.id as id, 
        quotes.id as quote_id,
        quotes.user_id as user_id,
        quote_elements.id as quote_element_id, 
        quote_medias.id as quote_media_id,
        customers.id as customer_id,
        customers.user_id as customer_user_id

        FROM quotes 

        LEFT JOIN quote_elements ON quotes.id = quote_elements.quote_id 
        LEFT JOIN quote_medias ON quotes.id = quote_medias.quote_id 
        LEFT JOIN customers ON quotes.customer_id = customers.id
        WHERE quotes.id = ? and quotes.user_id = ?`,
      [id, userId],
    );
    if (res.length === 0) throw new ErrorResponse("Quote Not found...", 404);

    const quote_elements = QuoteModel.extractQuoteElementsFromSqlJoin(res);
    const quote_medias = QuoteModel.extractQuoteMediasFromSqlJoin(res);
    const quote_base = QuoteModel.extractQuoteBaseFromSqlJoin(res[0]);
    let customer: customer | null = null;
    if (res[0].customer_id) {
      customer = {
        id: res[0].customer_id,
        user_id: res[0].user_id,
        first_name: res[0].first_name,
        last_name: res[0].last_name,
        street: res[0].street,
        city: res[0].city,
        zip: res[0].zip,
        phone: res[0].phone,
        email: res[0].email,
      };
    }

    const recontructed_quote: full_quote = {
      ...quote_base,
      customer,
      quote_elements,
      quote_medias,
    };

    return recontructed_quote;
  }

  //////////////////////////////////////////
  async getById(id: number): Promise<full_quote> {
    const res = await this.db.query(
      `SELECT *, 
        quotes.id as id, 
        quotes.id as quote_id,
        quotes.user_id as user_id,
        quote_elements.id as quote_element_id, 
        quote_medias.id as quote_media_id,
        customers.id as customer_id,
        customers.user_id as customer_user_id

        FROM quotes 

        LEFT JOIN quote_elements ON quotes.id = quote_elements.quote_id 
        LEFT JOIN quote_medias ON quotes.id = quote_medias.quote_id 
        LEFT JOIN customers ON quotes.customer_id = customers.id
        WHERE quotes.id = ?`,
      [id],
    );
    if (res.length === 0) throw new ErrorResponse("Quote Not found...", 404);

    const quote_elements = QuoteModel.extractQuoteElementsFromSqlJoin(res);
    const quote_medias = QuoteModel.extractQuoteMediasFromSqlJoin(res);
    const quote_base = QuoteModel.extractQuoteBaseFromSqlJoin(res[0]);
    let customer: customer | null = null;
    if (res[0].customer_id) {
      customer = {
        id: res[0].customer_id,
        user_id: res[0].user_id,
        first_name: res[0].first_name,
        last_name: res[0].last_name,
        street: res[0].street,
        city: res[0].city,
        zip: res[0].zip,
        phone: res[0].phone,
        email: res[0].email,
      };
    }

    const recontructed_quote: full_quote = {
      ...quote_base,
      customer,
      quote_elements,
      quote_medias,
    };

    return recontructed_quote;
  }

  //////        UPDATE        //////
  //////////////////////////////////////////
  async updateByidByUserId(
    id: number,
    userId: number,
    quote: Partial<Omit<full_quote, "id">>,
  ): Promise<full_quote> {
    const { customer, quote_elements, quote_medias, ...base_quote } = quote;
    const sql_base = "UPDATE quotes SET ? WHERE id = ? AND user_id = ?";
    const sql_quote_elements =
      "UPDATE quote_elements SET ? WHERE id = ? AND quote_id = ?";
    const sql_quote_medias =
      "UPDATE quote_medias SET ? WHERE id = ? AND quote_id = ?";

    //handling customer
    let customerId = customer?.id;
    if (customerId) {
      const resUpdateCustomer = await this.db.query(
        "UPDATE customers SET ? WHERE id = ? AND user_id = ?",
        [customer, customerId, userId],
      );
      if (resUpdateCustomer.affectedRows !== 1) {
        throw new ErrorResponse(
          "Could not update customer when updating quote",
          400,
        );
      }
    } else {
      const customerToInsert = { ...customer };
      delete customerToInsert.id;
      delete customerToInsert.user_id;

      const resInsertCustomer = await this.db.query(
        "INSERT INTO customers SET ?,user_id=?",
        [customerToInsert, userId],
      );
      if (resInsertCustomer.affectedRows !== 1) {
        throw new ErrorResponse(
          "Could not insert customer when updating quote",
          400,
        );
      }
      customerId = resInsertCustomer.insertId;
    }

    //handling base quote
    const res = await this.db.query(sql_base, [
      { ...base_quote, customer_id: customerId },
      id,
      userId,
    ]);
    if (res.affectedRows !== 1) {
      throw new ErrorResponse(
        "Could not update quote, no matching id for user",
        400,
      );
    }

    //handling quote_elements and quote_medias
    if (quote_elements && quote_elements.length > 0) {
      //extracting quote_element to create and to update
      const quote_elements_to_create: quote_element[] = [];
      const quote_elements_to_update: quote_element[] = [];

      quote_elements.map((el) => {
        if (el.id) {
          quote_elements_to_update.push(el);
        } else {
          quote_elements_to_create.push(el);
        }
      });

      // deleting quote_element not in request
      const quote_elements_ids = quote_elements.reduce((acc, el) => {
        if (!el.id) {
          return acc;
        }
        if (typeof el.id === "string") {
          const t = parseInt(el.id);
          if (isNaN(t)) {
            throw new ErrorResponse("id of quote_element is not valid", 400);
          }
          return [...acc, t];
        }
        if (typeof el.id !== "number") {
          throw new ErrorResponse("id of quote_element is not valid", 400);
        }
        return [...acc, el.id];
      }, [] as number[]);

      if (quote_elements_ids.length !== 0) {
        const sql_quote_elements_delete =
          "DELETE FROM quote_elements WHERE id NOT IN (?) AND quote_id = ?";
        await this.db.query(sql_quote_elements_delete, [
          quote_elements_ids,
          id,
        ]);
      }

      //creating quote_elements
      const res_create = quote_elements_to_create.map((el) =>
        this.db.query("INSERT INTO quote_elements SET ? ,quote_id= ?", [
          el,
          id,
        ]),
      );

      //updating quote_elements
      const res_update = quote_elements_to_update.map((el) => {
        const { quote_id: _, ...newEl } = el;
        return this.db.query(sql_quote_elements, [newEl, el.id, id]);
      });

      //awaiting create and update promises
      const res_elements = await Promise.allSettled([
        ...res_create,
        ...res_update,
      ]);

      if (
        res_elements.filter(
          (el) => el.status === "rejected" || el.value.affectedRows !== 1,
        ).length > 0
      ) {
        throw new ErrorResponse(
          "Could not update quote elements for this quote",
          400,
        );
      }
    }

    if (quote_medias && quote_medias.length > 0) {
      const res_medias = await Promise.allSettled(
        quote_medias.map((el) => {
          const { quote_id: _, ...newEl } = el;
          return this.db.query(sql_quote_medias, [newEl, el.id, id]);
        }),
      );

      if (
        res_medias.filter(
          (el) => el.status === "rejected" || el.value.affectedRows !== 1,
        ).length > 0
      ) {
        throw new ErrorResponse(
          "Could not update quote medias for this quote",
          400,
        );
      }
    }

    return await this.getByIdByUserId(id, userId);
  }

  //////        DELETE        //////
  //////////////////////////////////////////
  async deleteByIdByUserId(id: number, userId: number): Promise<boolean> {
    const sql = `
        DELETE quotes,customers 
        FROM quotes 
        INNER JOIN customers ON quotes.customer_id=customers.id
        WHERE quotes.id = ? AND quotes.user_id = ?;
    `;
    const res = await this.db.query(sql, [id, userId]);
    if (res.affectedRows === 0) {
      throw new ErrorResponse(
        "Could not delete quote, no matching id for user",
        404,
      );
    }
    return true;
  }

  //////////////////////////////////////////
  //                                      //
  //     STATIC METHODS                   //
  //                                      //
  //////////////////////////////////////////
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

  //////////////////////////////////////////
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

  //////////////////////////////////////////
  static extractQuoteBaseFromSqlJoin(
    joinResponse: quote &
      quote_media &
      quote_element & { quote_media_id: number; quote_element_id: number },
  ): Omit<quote, "customer_id"> {
    const quote_base = {
      id: joinResponse.quote_id,
      user_id: joinResponse.user_id,
      global_discount: joinResponse.global_discount,
      name: joinResponse.name,
      general_infos: joinResponse.general_infos,
      status: joinResponse.status,
      expires_at: joinResponse.expires_at,
      created_at: joinResponse.created_at,
    };
    return quote_base;
  }
}
