import { Schema, rule, Type } from "../utilities/DTO";
import { CustomerCreateSchema } from "./customer";

class QuoteElementCreate extends Schema {
  @rule({
    type: Type.Number,
  })
  work_id!: number;

  @rule({
    type: Type.String,
    maxLength: 25,
  })
  quote_section!: string;

  @rule({
    type: Type.Enum,
    values: ["20", "10", "5.5", "0"],
  })
  vat!: "20" | "10" | "5.5" | "0";

  @rule({
    type: Type.Number,
    float: true,
    max: 100,
  })
  discount!: number;

  @rule({
    type: Type.Number,
  })
  quantity!: number;
}
class QuoteMediaCreate extends Schema {
  @rule({
    type: Type.String,
    maxLength: 50,
  })
  path_name!: string;

  @rule({
    type: Type.String,
    maxLength: 100,
  })
  alt_text!: string;
}
class BaseQuoteCreate extends Schema {
  @rule({
    type: Type.Number,
  })
  user_id!: number;

  @rule({
    type: Type.Number,
    optional: true,
  })
  customer_id?: number;

  @rule({
    type: Type.Object,
    element: CustomerCreateSchema,
    optional: true,
  })
  customer?: CustomerCreateSchema;

  @rule({
    type: Type.Number,
    float: true,
    optional: true,
  })
  global_discount?: number; //default 0.0

  @rule({
    type: Type.String,
    optional: true,
  })
  name?: string;

  @rule({
    type: Type.String,
    optional: true,
  })
  general_infos?: string;

  @rule({
    type: Type.Enum,
    values: ["quote", "draft", "invoice", "validated"],
    optional: true,
  })
  status?: "quote" | "draft" | "invoice" | "validated"; //default draft

  @rule({
    type: Type.Date,
    minDate: new Date(),
    optional: true,
  })
  expires_at?: Date;
}
export class FullQuoteCreate extends BaseQuoteCreate {
  @rule({
    type: Type.Array,
    element: {
      type: Type.Object,
      element: QuoteElementCreate,
    },
    optional: true,
  })
  quote_elements?: QuoteElementCreate[];

  @rule({
    type: Type.Array,
    element: {
      type: Type.Object,
      element: QuoteMediaCreate,
    },
    optional: true,
  })
  quote_medias?: QuoteMediaCreate[];
}

// export const quoteMedias: Schema = {
//   id: {
//     type: "number",
//     min: 0,
//   },
//   path_name: {
//     type: "string",
//     maxLength: 50,
//   },
//   alt_text: {
//     type: "string",
//     maxLength: 100,
//   },
// };
// export const quoteElement: Schema = {
//   id: {
//     type: "number",
//   },
//   quote_id: {
//     type: "number",
//   },
//   work_id: {
//     type: "number",
//   },
//   quote_section: {
//     type: "string",
//     maxLength: 25,
//   },
//   vat: {
//     type: "enum",
//     values: ["20", "10", "5.5", "0"],
//   },
//   discount: {
//     type: "number",
//     float: true,
//     max: 100,
//     min: 0,
//   },
//   quantity: {
//     type: "number",
//     max: 999,
//   },
// };
// export const quote: Schema = {
//   id: {
//     type: "number",
//   },
//   user_id: {
//     type: "number",
//   },
//   customer_id: {
//     type: "number",
//   },
//   global_discount: {
//     type: "number",
//     float: true,
//     max: 100,
//     min: 0,
//   },
//   name: {
//     type: "string",
//     nullable: true,
//     maxLength: 100,
//   },
//   general_infos: {
//     type: "string",
//     nullable: true,
//   },
//   status: {
//     type: "enum",
//     values: ["quote", "draft", "invoice", "validated"],
//   },
//   expires_at: {
//     type: "date",
//     minDate: new Date(),
//   },
//   created_at: {
//     type: "date",
//     optional: true,
//   },
// };
