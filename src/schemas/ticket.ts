import { Schema, rule, Type } from "../utilities/DTO";

export class TicketCreateSchema extends Schema {
  @rule({
    type: Type.String,
    maxLength: 150,
  })
  object!: string;

  @rule({
    type: Type.String,
  })
  text_content!: string;
}
