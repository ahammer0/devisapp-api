import { Schema } from "../utilities/DTO";

export const userUpdate: Schema = {
  email: { type: "string", optional: true },
  password: { type: "password", optional: true },
  first_name: { type: "string", maxLength: 25, optional: true },
  last_name: { type: "string", maxLength: 25, optional: true },
  company_name: { type: "string", maxLength: 50, optional: true },
  company_address: { type: "string", maxLength: 100, optional: true },
  siret: { type: "string", maxLength: 25, optional: true },
  ape_code: { type: "string", maxLength: 20, optional: true },
  rcs_code: { type: "string", maxLength: 20, optional: true },
  tva_number: { type: "string", maxLength: 20, optional: true },
  company_type: { type: "string", optional: true },
  account_status: { type: "string", optional: true },
  created_at: { type: "date", optional: true },
  expires_at: { type: "date", optional: true },
  quote_infos: { type: "string", optional: true },
};
