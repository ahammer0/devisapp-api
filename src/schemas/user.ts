import { Schema, rule, Type } from "../utilities/DTO";

export class UserUpdateSchema extends Schema {
  @rule({
    type: Type.String,
    optional: true,
  })
  email?: string;

  @rule({
    type: Type.Password,
    optional: true,
  })
  password?: string;

  @rule({
    type: Type.String,
    optional: true,
    maxLength: 25,
  })
  first_name?: string;

  @rule({
    type: Type.String,
    optional: true,
    maxLength: 25,
  })
  last_name?: string;

  @rule({
    type: Type.String,
    optional: true,
    maxLength: 50,
  })
  company_name?: string;

  @rule({
    type: Type.String,
    optional: true,
    maxLength: 100,
  })
  company_address?: string;

  @rule({
    type: Type.String,
    optional: true,
    maxLength: 25,
  })
  siret?: string;

  @rule({
    type: Type.String,
    optional: true,
    maxLength: 20,
  })
  ape_code?: string;

  @rule({
    type: Type.String,
    optional: true,
    maxLength: 20,
  })
  rcs_code?: string;

  @rule({
    type: Type.String,
    optional: true,
    maxLength: 20,
  })
  tva_number?: string;

  @rule({
    type: Type.Enum,
    optional: true,
    values: ["Individuelle", "SAS", "SARL", "EURL"],
  })
  company_type?: "Individuelle" | "SAS" | "SARL" | "EURL";

  @rule({
    type: Type.Enum,
    optional: true,
    values: ["valid", "blocked", "deleted"],
  })
  account_status?: "valid" | "blocked" | "deleted";

  @rule({
    type: Type.Date,
    optional: true,
  })
  created_at?: Date;

  @rule({
    type: Type.Date,
    optional: true,
  })
  expires_at?: Date;

  @rule({
    type: Type.String,
    optional: true,
  })
  quote_infos?: string;
}
