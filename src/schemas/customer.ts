import { Schema, rule, Type } from "../utilities/DTO";

// export const customer: Schema = {
//   id: {
//     type: "number",
//   },
//   user_id: {
//     type: "number",
//   },
//   first_name: {
//     type: "string",
//     optional: true,
//     nullable: true,
//     maxLength: 50,
//   },
//   last_name: {
//     type: "string",
//     optional: true,
//     nullable: true,
//     maxLength: 50,
//   },
//   street: {
//     type: "string",
//     optional: true,
//     nullable: true,
//     maxLength: 40,
//   },
//   city: {
//     type: "string",
//     optional: true,
//     nullable: true,
//     maxLength: 50,
//   },
//   zip: {
//     type: "number",
//     optional: true,
//     nullable: true,
//     min: 0,
//     max: 99999,
//   },
//   phone: {
//     type: "string",
//     optional: true,
//     nullable: true,
//     maxLength: 20,
//   },
//   email: {
//     type: "email",
//     optional: true,
//     nullable: true,
//     maxLength: 30,
//   },
// };
export class CustomerCreateSchema extends Schema {
  @rule({
    type: Type.Number,
  })
  user_id!: number;

  @rule({
    type: Type.String,
    optional: true,
    nullable: true,
    maxLength: 50,
  })
  first_name?: string;

  @rule({
    type: Type.String,
    optional: true,
    nullable: true,
    maxLength: 50,
  })
  last_name?: string;

  @rule({
    type: Type.String,
    optional: true,
    nullable: true,
    maxLength: 40,
  })
  street?: string;

  @rule({
    type: Type.String,
    optional: true,
    nullable: true,
    maxLength: 50,
  })
  city?: string;

  @rule({
    type: Type.Number,
    optional: true,
    nullable: true,
    min: 0,
    max: 99999,
  })
  zip?: number;

  @rule({
    type: Type.String,
    optional: true,
    nullable: true,
    maxLength: 20,
  })
  phone?: string;

  @rule({
    type: Type.Email,
    optional: true,
    nullable: true,
    maxLength: 30,
  })
  email?: string;
}
